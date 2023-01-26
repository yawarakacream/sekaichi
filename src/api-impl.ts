import { createApi } from "./api";
import { Question, Tag, UUID } from "./item-type";
import { PartialSome } from "./utility";

export const QuestionPost = createApi<{ question: Omit<Question, "uuid"> }, { uuid: UUID }>("/question", "POST");
export const QuestionPut = createApi<{ question: Question }, {}>("/question", "PUT");

export const QuestionSearchPost = createApi<{ tagsIncluded: UUID[]; tagsExcluded: UUID[] }, { questions: Question[] }>(
  "/question/search",
  "POST"
);

export const TagPost = createApi<{ tags: PartialSome<Tag, "uuid">[] }, {}>("/tag", "POST");

export const ExaminationPost = createApi<
  {
    name: string;
    tagsExcluded: UUID[];
    parts: {
      tags: UUID[];
      size: number;
    }[];
  },
  { uuid: UUID }
>("/examination", "POST");
export const ExaminationTakePost = createApi<
  {
    examinationUuid: UUID;
    examineeAnswers: (0 | 1 | 2 | 3)[];
  },
  {}
>("/examination/take", "POST");
