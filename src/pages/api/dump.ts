import { readFile } from "fs/promises";
import env from "../../env";
import { formatDate } from "../../utility";
import { NextApiHandler } from "next";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") throw new Error();

  try {
    const fileName = formatDate(new Date(), "filename") + ".sqlite3";
    const buffer = await readFile(env.SQLITE3_FILE);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
    res.status(200);
  } catch (e) {
    res.status(405).end();
  }
};

export default handler;
