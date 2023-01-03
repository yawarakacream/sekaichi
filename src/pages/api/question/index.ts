import { handleApi, routeApi } from "../../../api";
import { QuestionPost, QuestionPut } from "../../../api-impl";
import { connectDatabase } from "../../../database";

const post = handleApi(QuestionPost, async ({ body: { question } }) => {
  const uuid = await connectDatabase((client) => client.createQuestion(question));
  return { statusCode: 201, body: { uuid } };
});

const put = handleApi(QuestionPut, async ({ body: { question } }) => {
  await connectDatabase((client) => client.updateQuestion(question));
  return { statusCode: 201, body: {} };
});

const handler = routeApi([post, put]);

export default handler;
