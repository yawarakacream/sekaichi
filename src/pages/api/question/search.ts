import { handleApi, routeApi } from "../../../api";
import { QuestionSearchPost } from "../../../api-impl";
import { connectDatabase } from "../../../database";

const post = handleApi(QuestionSearchPost, async ({ body: { tags } }) => {
  const questions = await connectDatabase((client) => client.searchQuestions(tags));
  return { statusCode: 200, body: { questions } };
});

const handler = routeApi([post]);

export default handler;
