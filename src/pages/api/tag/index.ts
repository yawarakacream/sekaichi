import { handleApi, routeApi } from "../../../api";
import { TagPost } from "../../../api-impl";
import { connectDatabase } from "../../../database";

const post = handleApi(TagPost, async ({ body: { tags } }) => {
  const complete = await connectDatabase((client) => client.setTags(tags));
  return { statusCode: complete ? 200 : 405, body: {} };
});

const handler = routeApi([post]);

export default handler;
