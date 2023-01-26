import { v4 as uuidv4 } from "uuid";
import { handleApi, routeApi } from "../../../api";
import { ExaminationPost } from "../../../api-impl";
import { connectDatabase } from "../../../database";
import { Examination, Exampart, Examquestion } from "../../../item-type";
import { shuffle } from "../../../utility";

const post = handleApi(ExaminationPost, async ({ body: { name, tagsExcluded, parts } }) => {
  return await connectDatabase(async (client) => {
    const examquestions: Examquestion[] = [];
    const examparts = await Promise.all(
      parts.map(async ({ tags, size }) => {
        const exampart: Exampart = { uuid: uuidv4(), tags };

        const candidateQuestions = await client.searchQuestions(tags, tagsExcluded);
        if (!(1 <= size && size <= candidateQuestions.length)) throw new Error();
        shuffle(candidateQuestions)
          .slice(0, size)
          .forEach((question) => {
            const examquestion: Examquestion = {
              exampart: exampart.uuid,
              question: question.uuid,
              answerOrder: shuffle([0, 1, 2, 3]) as any,
              examineeAnswer: null,
            };
            examquestions.push(examquestion);
          });

        return exampart;
      })
    );

    const examination: Examination = {
      uuid: uuidv4(),
      name,
      excludedTags: tagsExcluded,
      examparts,
      answeredAt: null,
    };

    await client.insertExamination(examination, examquestions);

    return { statusCode: 201, body: { uuid: examination.uuid } };
  });
});

const handler = routeApi([post]);

export default handler;
