import { validate as _isUuid } from "uuid";
import { isNaturalNumber } from "./utility";

export type UUID = string;
export const isUuid = (obj: any): obj is UUID => typeof obj === "string" && _isUuid(obj);

export interface Tag {
  index: number;
  uuid: UUID;
  name: string;
}
export const isTag = (obj: any): obj is Tag => {
  if (!obj) return false;
  const { uuid, name } = obj;
  return isUuid(uuid) && typeof name === "string";
};

export const NUMBER_OF_SELECTIONS = 4;

export interface Question {
  uuid: UUID;
  tags: UUID[];
  statement: string;
  selections: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  point: number;
  figure: string | null;
  createdAt: number;
}
export const isQuestion = (obj: any): obj is Question => {
  const { uuid, ...rest } = obj;
  return isUuid(uuid) && isQuestionWithoutUuid(rest);
};
export const isQuestionWithoutUuid = (obj: any): obj is Omit<Question, "uuid"> => {
  if (!obj) return false;
  const { tags, statement, selections, answer, point, figure, createdAt } = obj;
  return (
    Array.isArray(tags) &&
    tags.every((t) => typeof t === "string" && isUuid(t)) &&
    typeof statement === "string" &&
    Array.isArray(selections) &&
    selections.length === 4 &&
    selections.every((s) => typeof s === "string") &&
    typeof answer === "number" &&
    [0, 1, 2, 3].includes(answer) &&
    typeof point === "number" &&
    isNaturalNumber(point) &&
    (figure === null || typeof figure === "string") &&
    typeof createdAt === "number" &&
    isNaturalNumber(createdAt)
  );
};

export interface Examination {
  uuid: UUID;
  name: string;
  excludedTags: UUID[];
  examparts: Exampart[];
  answeredAt: number | null;
}
export const isExamination = (obj: any): obj is Examination => {
  if (!obj) return false;
  const { uuid, name, excludedTags, examparts, answeredAt } = obj;
  return (
    isUuid(uuid) &&
    typeof name === "string" &&
    Array.isArray(excludedTags) &&
    excludedTags.every((tag) => isUuid(tag)) &&
    Array.isArray(examparts) &&
    examparts.every((part) => isExampart(part)) &&
    (answeredAt === null || typeof answeredAt === "number")
  );
};

export interface Exampart {
  uuid: UUID;
  tags: UUID[];
}
export const isExampart = (obj: any): obj is Exampart => {
  if (!obj) return false;
  const { uuid, tags } = obj;
  return isUuid(uuid) && Array.isArray(tags) && tags.every((t) => isUuid(t));
};

export interface Examquestion {
  exampart: UUID;
  question: UUID;
  answerOrder: [0 | 1 | 2 | 3, 0 | 1 | 2 | 3, 0 | 1 | 2 | 3, 0 | 1 | 2 | 3];
  examineeAnswer: null | 0 | 1 | 2 | 3;
}
export const isExamquestion = (obj: any): obj is Examquestion => {
  if (!obj) return false;
  const { exampart, question, answerOrder, examineeAnswer } = obj;
  return (
    isUuid(exampart) &&
    isUuid(question) &&
    Array.isArray(answerOrder) &&
    answerOrder.length === 4 &&
    answerOrder.every((a) => [0, 1, 2, 3].includes(a)) &&
    (examineeAnswer === null || [0, 1, 2, 3].includes(examineeAnswer))
  );
};

export interface ExaminationScore {
  sum: {
    max: number;
    examinee: number;
  };
  parts: {
    uuid: UUID;
    max: number;
    examinee: number;
  }[];
}
