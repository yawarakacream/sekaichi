import { handleApi, routeApi } from "../../../api";
import { ExaminationTakePost } from "../../../api-impl";
import { connectDatabase } from "../../../database";

const post = handleApi(ExaminationTakePost, async ({ body: { examinationUuid, examineeAnswers } }) => {
  return await connectDatabase(async (client) => {
    await client.setExaminationAnswer(examinationUuid, examineeAnswers);
    return { statusCode: 201, body: {} };
  });
});

const handler = routeApi([post]);

export default handler;
