import { handleApi, routeApi } from "../../../api";
import { QuestionSearchPost } from "../../../api-impl";
import { connectDatabase } from "../../../database";

const post = handleApi(QuestionSearchPost, async ({ body: { tagsIncluded, tagsExcluded } }) => {
  const questions = await connectDatabase((client) => client.searchQuestions(tagsIncluded, tagsExcluded));
  return { statusCode: 200, body: { questions } };
});

const handler = routeApi([post]);

export default handler;
