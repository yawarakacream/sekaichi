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

export interface Practice {
  uuid: UUID;
  name: string;
}
