import { createApi } from "./api";
import { Question, Tag, UUID } from "./item-type";
import { PartialSome } from "./utility";

export const QuestionPost = createApi<{ question: Omit<Question, "uuid"> }, { uuid: UUID }>("/question", "POST");
export const QuestionPut = createApi<{ question: Question }, {}>("/question", "PUT");

export const QuestionSearchPost = createApi<{ tags: UUID[] }, { questions: Question[] }>("/question/search", "POST");

export const TagPost = createApi<{ tags: PartialSome<Tag, "uuid">[] }, {}>("/tag", "POST");
