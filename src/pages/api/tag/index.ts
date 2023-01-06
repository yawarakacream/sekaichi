import { handleApi, routeApi } from "../../../api";
import { TagPost } from "../../../api-impl";
import { connectDatabase } from "../../../database";

const post = handleApi(TagPost, async ({ body: { tags } }) => {
  try {
    await connectDatabase((client) => client.setTags(tags));
    return { statusCode: 200, body: {} };
  } catch (e) {
    console.log(e);
    return { statusCode: 405, body: {} };
  }
});

const handler = routeApi([post]);

export default handler;
