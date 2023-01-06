import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { Database as Sqlite3 } from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import { isQuestion, isTag, isUuid, Question, Tag, UUID } from "./item-type";
import { sample } from "./sample";
import { PartialSome, removeLineBreaks } from "./utility";

const sqliteFolder = `${process.cwd()}/sekaichi-data`;
const sqliteFiles = {
  main: `${sqliteFolder}/main.sqlite3`,
  test: `${sqliteFolder}/test.sqlite3`,
  table: `${sqliteFolder}/table.sql`,
};

class Sqlite3Wrapper {
  private _db: Sqlite3 | undefined;
  private get db(): Sqlite3 {
    if (this._db === undefined) throw new Error();
    return this._db;
  }

  async open(path: string) {
    const needInitialize = !existsSync(path);
    this._db = new Sqlite3(path);
    this.db.get("PRAGMA foreign_keys = ON");
    return needInitialize;
  }

  async close() {
    this.db.close();
    this._db = undefined;
  }

  async executeUpdate(sql: string, params?: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (error) => {
        if (error !== null) reject(error);
        else resolve();
      });
    });
  }

  async executeQuery(sql: string, params?: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows) => {
        if (error !== null) reject(error);
        else resolve(rows);
      });
    });
  }
}

class DatabaseClient {
  private _db: Sqlite3Wrapper | undefined;
  private get db(): Sqlite3Wrapper {
    if (this._db === undefined) throw new Error();
    return this._db;
  }

  async open() {
    this._db = new Sqlite3Wrapper();
    const path = process.env.NODE_ENV === "production" ? sqliteFiles.main : sqliteFiles.test;
    // const path = ":memory:";
    const needInitialize = await this.db.open(path);

    if (needInitialize) {
      const initializer = await readFile(sqliteFiles.table, { encoding: "utf-8" }).then((buffer) => buffer.toString());
      for (const sql of initializer.split(";")) {
        const tmp = removeLineBreaks(sql);
        if (tmp.length === 0) continue;
        await this.db.executeUpdate(sql);
      }

      if (process.env.NODE_ENV !== "production") {
        await this.setTags(sample.tags);
        await Promise.all(sample.questions.map(({ uuid, ...rest }) => this._createQuestion(rest, uuid)));
      }
    }
  }

  async close() {
    this.db.close();
  }

  async getAllTags(): Promise<Tag[]> {
    const result = await this.db.executeQuery("SELECT idx, uuid, name FROM tag ORDER BY idx", []);
    const tags = result.map((row, i) => {
      const tag: Record<keyof Tag, unknown> = { index: row.idx, uuid: row.uuid, name: row.name };
      if (!isTag(tag)) throw new Error();
      if (tag.index !== i) throw new Error();
      return tag;
    });
    return tags;
  }

  // private async _createTag(tag: Omit<Tag, "uuid">, uuid: UUID): Promise<void> {
  //   await this.db.executeUpdate("INSERT INTO tag(idx, uuid, name) VALUES(?, ?, ?)", [tag.index, uuid, tag.name]);
  // }

  async setTags(tags: PartialSome<Tag, "uuid">[]): Promise<void> {
    // index 確認
    if (!tags.every((tag, i) => tag.index === i)) {
      throw new Error("Illegal indices: " + tags);
    }

    // uuid がなければ新規作成
    tags.forEach((tag) => (tag.uuid ??= uuidv4()));

    await this.db.executeQuery("DELETE FROM tag");
    await this.db.executeQuery(
      `INSERT INTO tag(idx, uuid, name) VALUES${tags.map(() => "(?, ?, ?)").join(",")}`,
      tags.flatMap((tag) => [tag.index, tag.uuid, tag.name])
    );
  }

  async getQuestion(uuid: UUID): Promise<Question | null> {
    const result = await this.db.executeQuery(
      "SELECT statement, selections, answer, point, figure, created_at FROM question WHERE uuid = ?",
      [uuid]
    );
    if (result === undefined) return null;

    const row = result[0];
    if (row === undefined) return null;

    const question: Record<keyof Question, unknown> = {
      uuid,
      tags: await this.getQuestionTag(uuid),
      statement: row.statement,
      selections: JSON.parse(row.selections),
      answer: row.answer,
      point: row.point,
      figure: row.figure,
      createdAt: row.created_at,
    };
    if (!isQuestion(question)) throw new Error();
    return question;
  }

  // async getAllQuestions(): Promise<Question[]> {
  //   const result = await this.db.executeQuery(
  //     `SELECT statement, selections, answer, point, figure, created_at FROM question`,
  //     []
  //   );
  //   const questions: Question[] = await Promise.all(
  //     result.map(async (row) => {
  //       const uuid = row.uuid;
  //       if (!isUuid(uuid)) throw new Error();
  //       const question: Record<keyof Question, unknown> = {
  //         uuid,
  //         tags: await this.getQuestionTag(uuid),
  //         statement: row.statement,
  //         selections: JSON.parse(row.selections),
  //         answer: row.answer,
  //         point: row.point,
  //         figure: row.figure,
  //         createdAt: row.created_at,
  //       };
  //       if (!isQuestion(question)) throw new Error();
  //       return question;
  //     })
  //   );
  //   return questions;
  // }

  async searchQuestions(tags: UUID[]): Promise<Question[]> {
    let result: any[];
    if (tags.length === 0) {
      // どのタグもつけられていない問題を検索する
      result = await this.db.executeQuery(
        `
          SELECT
            q.uuid, q.statement, q.selections, q.answer, q.point, q.figure, q.created_at
          FROM
            question AS q
          WHERE
            NOT EXISTS ( SELECT * FROM question_tag as qt WHERE q.uuid = qt.question_uuid )
      `
      );
    } else {
      // AND 検索なら HAVING COUNT(q.uuid) = tags.length する
      result = await this.db.executeQuery(
        `
          SELECT
            q.uuid, q.statement, q.selections, q.answer, q.point, q.figure, q.created_at
          FROM
            question AS q
            JOIN question_tag AS qt ON q.uuid = qt.question_uuid
          WHERE
            qt.tag_uuid IN (${tags.map(() => "?").join(",")})
          GROUP BY
            q.uuid
          HAVING
            COUNT(q.uuid) = ?
      `,
        [...tags, tags.length]
      );
    }

    const questions = await Promise.all(
      result.map(async (row) => {
        const uuid = row.uuid;
        if (!isUuid(uuid)) throw new Error();

        const tags = await this.getQuestionTag(uuid);
        const question: Record<keyof Question, unknown> = {
          uuid,
          tags,
          statement: row.statement,
          selections: JSON.parse(row.selections),
          answer: row.answer,
          point: row.point,
          figure: row.figure,
          createdAt: row.created_at,
        };
        if (!isQuestion(question)) throw new Error();
        return question;
      })
    );
    return questions;
  }

  async searchNumberOfQuestions(tag: UUID): Promise<number> {
    const result = await this.db.executeQuery("SELECT COUNT(tag_uuid) as count FROM question_tag WHERE tag_uuid = ?", [
      tag,
    ]);
    const count = result[0].count;
    if (typeof count !== "number") throw new Error();
    return count;
  }

  async createQuestion(question: Omit<Question, "uuid">): Promise<UUID> {
    const uuid = uuidv4();
    await this._createQuestion(question, uuid);
    return uuid;
  }

  private async _createQuestion(question: Omit<Question, "uuid">, uuid: UUID): Promise<void> {
    await this.db.executeUpdate(
      "INSERT INTO question(uuid, statement, selections, answer, point, figure, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)",
      [
        uuid,
        question.statement,
        JSON.stringify(question.selections),
        question.answer,
        question.point,
        question.figure,
        question.createdAt,
      ]
    );
    await this.setQuestionTag(uuid, question.tags);
  }

  async updateQuestion(question: Question): Promise<void> {
    await this.db.executeUpdate(
      "UPDATE question SET statement = ?, selections = ?, answer = ?, point = ?, figure = ? WHERE uuid = ?",
      [
        question.statement,
        JSON.stringify(question.selections),
        question.answer,
        question.point,
        question.figure,
        question.uuid,
      ]
    );
    await this.setQuestionTag(question.uuid, question.tags);
  }

  private async getQuestionTag(questionUuid: UUID): Promise<UUID[]> {
    const result = await this.db.executeQuery("SELECT tag_uuid FROM question_tag WHERE question_uuid = ?", [
      questionUuid,
    ]);
    return result.map((row) => {
      const tagUuid = row.tag_uuid;
      if (!isUuid(tagUuid)) throw new Error();
      return tagUuid;
    });
  }

  private async setQuestionTag(questionUuid: UUID, tagUuids: UUID[]): Promise<void> {
    await this.db.executeUpdate("DELETE FROM question_tag WHERE question_uuid = ?", [questionUuid]);
    await Promise.all(
      tagUuids.map((tagUuid) =>
        this.db.executeUpdate("INSERT INTO question_tag(question_uuid, tag_uuid) VALUES(?, ?)", [questionUuid, tagUuid])
      )
    );
  }
}

export const connectDatabase = async <T = void>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> => {
  const client = new DatabaseClient();
  await client.open();
  try {
    return await callback(client);
  } finally {
    await client.close();
  }
};
