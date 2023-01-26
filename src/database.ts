import { existsSync } from "fs";
import { Database as Sqlite3 } from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import {
  Examination,
  ExaminationScore,
  Exampart,
  Examquestion,
  isExamination,
  isExampart,
  isExamquestion,
  isQuestion,
  isTag,
  isUuid,
  Question,
  Tag,
  UUID,
} from "./item-type";
import { sample } from "./sample";
import { PartialSome, removeLineBreaks } from "./utility";
import tableSql from "./table.sql";
import env from "./env";

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
    const needInitialize = await this.db.open(env.SQLITE3_FILE);
    // const needInitialize = await this.db.open(":memory:");

    if (needInitialize) {
      for (const sql of tableSql.split(";")) {
        const tmp = removeLineBreaks(sql);
        if (tmp.length === 0) continue;
        await this.db.executeUpdate(sql);
      }

      await this.setTags(sample.tags);
      await Promise.all(sample.questions.map(({ uuid, ...rest }) => this._createQuestion(rest, uuid)));
      await this.insertExamination(sample.examinations[0], sample.examquestions);
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

  async setTags(tags: PartialSome<Tag, "uuid">[]): Promise<void> {
    // index 確認
    if (!tags.every((tag, i) => tag.index === i)) {
      throw new Error("Illegal indices: " + tags);
    }

    const currentTags = await this.getAllTags();
    await Promise.all(
      currentTags
        .filter((tag) => tags.every((t) => tag.uuid !== t.uuid))
        .map((tag) => this.db.executeUpdate("DELETE FROM tag WHERE uuid = ?", [tag.uuid]))
    );

    await Promise.all(
      tags.map(async (tag) => {
        if (currentTags.some((t) => tag.uuid === t.uuid)) {
          await this.db.executeUpdate("UPDATE tag SET idx = ?, name = ? WHERE uuid = ?", [
            tag.index,
            tag.name,
            tag.uuid,
          ]);
        } else {
          await this.db.executeQuery(`INSERT INTO tag(idx, uuid, name) VALUES (?, ?, ?)`, [
            tag.index,
            tag.uuid ?? uuidv4(),
            tag.name,
          ]);
        }
      })
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

  async searchQuestions(tagsIncluded: UUID[], tagsExcluded: UUID[]): Promise<Question[]> {
    let result: any[];
    if (tagsIncluded.length === 0) {
      if (tagsExcluded.length > 0) throw new Error();
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
          WHERE
            EXISTS (
              SELECT
                qt.question_uuid
              FROM
                question_tag AS qt
              WHERE
                q.uuid = qt.question_uuid
                AND
                qt.tag_uuid IN (${tagsIncluded.map(() => "?").join(",")})
              GROUP BY
                qt.question_uuid
              HAVING
                COUNT(qt.question_uuid) = ?
            )
            AND
            NOT EXISTS (
              SELECT
                qt.question_uuid
              FROM
                question_tag AS qt
              WHERE
                q.uuid = qt.question_uuid
                AND
                qt.tag_uuid IN (${tagsExcluded.map(() => "?").join(",")})
            )
      `,
        [...tagsIncluded, tagsIncluded.length, ...tagsExcluded]
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

  async getExamination(uuid: UUID): Promise<Examination | null> {
    const result = await this.db.executeQuery("SELECT uuid, name, answered_at FROM examination WHERE uuid = ?", [uuid]);
    if (result === undefined) return null;

    const row = result[0];
    if (row === undefined) return null;

    const [excludedTags, examparts] = await Promise.all([
      this.getExaminationExcludedTags(uuid),
      this.getExamparts(uuid),
    ]);

    if (examparts === null || examparts.length <= 0) throw new Error();

    const examination: Record<keyof Examination, unknown> = {
      uuid: row.uuid,
      name: row.name,
      excludedTags,
      examparts,
      answeredAt: row.answered_at,
    };
    if (!isExamination(examination)) throw new Error();
    return examination;
  }

  private async getExaminationExcludedTags(uuid: UUID): Promise<UUID[]> {
    const result = await this.db.executeQuery(
      "SELECT tag_uuid FROM examination_excludedtags WHERE examination_uuid = ?",
      [uuid]
    );
    return result.map((row) => {
      const tagUuid = row.tag_uuid;
      if (!isUuid(tagUuid)) throw new Error();
      return tagUuid;
    });
  }

  private async getExamparts(examinationUuid: UUID): Promise<Exampart[] | null> {
    const result = await this.db.executeQuery("SELECT uuid FROM exampart WHERE examination_uuid = ?", [
      examinationUuid,
    ]);
    if (result === undefined) return null;

    return await Promise.all(
      result.map(async (row) => {
        const uuid = row.uuid;
        if (!isUuid(uuid)) throw new Error();

        const exampart: Record<keyof Exampart, unknown> = {
          uuid: row.uuid,
          tags: await this.getExampartTags(uuid),
        };
        if (!isExampart(exampart)) throw new Error();
        return exampart;
      })
    );
  }

  private async getExampartTags(exampartUuid: UUID): Promise<UUID[]> {
    const result = await this.db.executeQuery("SELECT tag_uuid FROM exampart_tag WHERE exampart_uuid = ?", [
      exampartUuid,
    ]);
    return result.map((row) => {
      const tagUuid = row.tag_uuid;
      if (!isUuid(tagUuid)) throw new Error();
      return tagUuid;
    });
  }

  async getAllExaminations(): Promise<Examination[]> {
    const result = await this.db.executeQuery("SELECT uuid FROM examination");
    const examinations = await Promise.all(
      result.map(async ({ uuid }) => {
        if (!isUuid(uuid)) throw new Error();
        const examination = await this.getExamination(uuid);
        if (examination === null) throw new Error();
        return examination;
      })
    );
    return examinations.sort((a, b) => {
      if (a.answeredAt === b.answeredAt) return a.uuid.localeCompare(b.uuid);
      if (a.answeredAt === null) return 1;
      if (b.answeredAt === null) return -1;
      return a.answeredAt - b.answeredAt;
    });
  }

  async getExamquestions(examinationUuid: UUID): Promise<[Examquestion[], Question[]]> {
    const result = await this.db.executeQuery(
      `
        SELECT
          exampart_uuid, question_uuid, idx, answer_order, examinee_answer
        FROM
          examquestion AS que
          JOIN exampart AS part ON que.exampart_uuid = part.uuid
          JOIN examination AS exam ON part.examination_uuid = exam.uuid
        WHERE
          exam.uuid = ?
      `,
      [examinationUuid]
    );

    const usedQuestionUuids = new Set<string>();

    const examquestions = result
      .sort((rowA, rowB) => Number.parseInt(rowA.idx) - Number.parseInt(rowB.idx))
      .map((row) => {
        const examquestion: Record<keyof Examquestion, unknown> = {
          exampart: row.exampart_uuid,
          question: row.question_uuid,
          answerOrder: JSON.parse(row.answer_order),
          examineeAnswer: row.examinee_answer,
        };
        if (!isExamquestion(examquestion)) throw new Error();
        usedQuestionUuids.add(examquestion.question);
        return examquestion;
      });

    const questions = await Promise.all(
      Array.from(usedQuestionUuids).map(async (questionUuid) => {
        const question = await this.getQuestion(questionUuid);
        if (question === null) throw new Error();
        return question;
      })
    );

    return [examquestions, questions];
  }

  async insertExamination(examination: Examination, questions: Examquestion[]): Promise<void> {
    await this.db.executeUpdate("INSERT INTO examination(uuid, name, answered_at) VALUES(?, ?, ?)", [
      examination.uuid,
      examination.name,
      examination.answeredAt,
    ]);
    await Promise.all(
      examination.excludedTags.map(async (excludedTagUuid) => {
        await this.db.executeUpdate("INSERT INTO examination_excludedtags(examination_uuid, tag_uuid) VALUES(?, ?)", [
          examination.uuid,
          excludedTagUuid,
        ]);
      })
    );
    await Promise.all(
      examination.examparts.map(async (exampart) => {
        await this.db.executeUpdate("INSERT INTO exampart(uuid, examination_uuid) VALUES(?, ?)", [
          exampart.uuid,
          examination.uuid,
        ]);
        await Promise.all(
          exampart.tags.map(async (exampartTagUuid) => {
            await this.db.executeUpdate("INSERT INTO exampart_tag(exampart_uuid, tag_uuid) VALUES(?, ?)", [
              exampart.uuid,
              exampartTagUuid,
            ]);
          })
        );
      })
    );
    await Promise.all(
      questions.map(
        async (examquestion, index) =>
          await this.db.executeUpdate(
            "INSERT INTO examquestion(exampart_uuid, question_uuid, idx, answer_order, examinee_answer) VALUES(?, ?, ?, ?, ?)",
            [
              examquestion.exampart,
              examquestion.question,
              index,
              JSON.stringify(examquestion.answerOrder),
              examquestion.examineeAnswer,
            ]
          )
      )
    );
  }

  async getExaminationScore(examinationUuid: UUID): Promise<ExaminationScore> {
    const result = await this.db.executeQuery(
      `
        SELECT
          part.uuid, question.answer, question.point, examque.examinee_answer
        FROM
          examquestion as examque
          JOIN exampart AS part ON examque.exampart_uuid = part.uuid
          JOIN question ON examque.question_uuid = question.uuid
        WHERE
          part.examination_uuid = ?
      `,
      [examinationUuid]
    );

    const partToScores: { [part in UUID]?: [number, number] } = {};
    result.forEach((row) => {
      const uuid = row.uuid;
      if (!isUuid(uuid)) throw new Error();
      const answer = row.answer;
      if (typeof answer !== "number") throw new Error();
      const point = row.point;
      if (typeof point !== "number") throw new Error();
      const examineeAnswer = row.examinee_answer;
      if (typeof examineeAnswer !== "number") throw new Error();

      partToScores[uuid] ??= [0, 0];
      partToScores[uuid]![0] += point;
      if (answer === examineeAnswer) {
        partToScores[uuid]![1] += point;
      }
    });

    const parts = Object.entries(partToScores).map(([k, v]) => {
      if (v === undefined) throw new Error();
      return { uuid: k, max: v[0], examinee: v[1] };
    });
    const sum = parts.reduce(
      (acc, curr) => {
        acc.max += curr.max;
        acc.examinee += curr.examinee;
        return acc;
      },
      { max: 0, examinee: 0 }
    );

    const scores: ExaminationScore = { sum, parts };
    return scores;
  }

  async setExaminationAnswer(examinationUuid: UUID, answers: (0 | 1 | 2 | 3)[]): Promise<void> {
    const examquestions = await this.getExamquestions(examinationUuid).then((v) => v[0]);
    if (examquestions.length !== answers.length) throw new Error();

    await Promise.all(
      examquestions.map(async (eq, i) => {
        await this.db.executeUpdate(
          `
            UPDATE
              examquestion
            SET
              examinee_answer = ?
            WHERE
              exampart_uuid = ?
              AND
              idx = ?
          `,
          [answers[i], eq.exampart, i]
        );
      })
    );
    await this.db.executeUpdate("UPDATE examination SET answered_at = ? WHERE uuid = ?", [Date.now(), examinationUuid]);
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
