import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import styled from "styled-components";
import { ExaminationSumScore, ExampartScore, percentToColor, scoreToPercent } from "..";
import { connectDatabase } from "../../../database";
import { Examination, ExaminationScore, Examquestion, Question, Tag, UUID } from "../../../item-type";
import { Card, CardContainer } from "../../../layout/Card";
import { BasicButton, LinkButton, ToggleButton } from "../../../layout/Input";
import Layout, { PageTitle } from "../../../layout/Layout";
import QuestionCard from "../../../layout/QuestionCard";
import { formatDate } from "../../../utility";

interface Props {
  tags: Tag[];
  questions: Question[];
  examination: Examination;
  examquestions: Examquestion[];
  examScore: ExaminationScore;
}

export default function ExaminationViewPage({ tags, questions, examination, examquestions, examScore }: Props) {
  const tagsUuidToName: { [key in UUID]?: string } = useMemo(() => {
    return tags.reduce((acc, curr) => {
      acc[curr.uuid] = curr.name;
      return acc;
    }, {} as { [key in UUID]?: string });
  }, [tags]);

  const questionUuidToQuestion: { [key in UUID]?: Question } = useMemo(() => {
    return questions.reduce((acc, curr) => {
      acc[curr.uuid] = curr;
      return acc;
    }, {} as { [key in UUID]?: Question });
  }, [questions]);

  const exampartUuidToIndex: { [key in UUID]?: number } = useMemo(() => {
    return examination.examparts.reduce((acc, curr, i) => {
      acc[curr.uuid] = i;
      return acc;
    }, {} as { [key in UUID]?: number });
  }, [examination]);

  const isTagExcluded = useMemo(() => {
    return tags.map((tag) => examination.excludedTags.some((et) => et === tag.uuid));
  }, [tags, examination]);

  const percentageScores = useMemo(() => scoreToPercent(examScore), [examScore]);

  return (
    <Layout title={`${examination.name} - 模試`}>
      <WrappedPageTitle>
        模試「{examination.name}」
        <ExaminationDate>
          {examination.answeredAt === null ? (
            <LinkButton href={`/examination/take/${examination.uuid}`}>受験する</LinkButton>
          ) : (
            <span>@ {formatDate(new Date(examination.answeredAt))}</span>
          )}
        </ExaminationDate>
      </WrappedPageTitle>

      <ScoreContainer>
        <ScoreTitle>総合</ScoreTitle>
        <TagContainer>
          {tags.map((t, i) => (
            <ToggleButtonWrapper key={i}>
              <ToggleButton key={t.uuid} style="negative" checked={isTagExcluded[i]}>
                {t.name}
              </ToggleButton>
            </ToggleButtonWrapper>
          ))}
        </TagContainer>
        <ExaminationSumScore color={percentToColor(percentageScores.sum)}>
          {percentageScores.sum} %
          <br />
          {examScore.sum.examinee} / {examScore.sum.max} 点
        </ExaminationSumScore>
      </ScoreContainer>

      {examination.examparts.map((exampart, i) => (
        <ScoreContainer key={exampart.uuid}>
          <ScoreTitle>{i + 1}</ScoreTitle>
          <TagContainer>
            {exampart.tags.map((t) => (
              <ToggleButtonWrapper key={t}>
                <ToggleButton key={t} checked={true}>
                  {tagsUuidToName[t] ?? ""}
                </ToggleButton>
              </ToggleButtonWrapper>
            ))}
          </TagContainer>
          <ExampartScore color={percentToColor(percentageScores.parts[i])}>
            {percentageScores.parts[i]} %
            <br />
            {examScore.parts[i].examinee} / {examScore.parts[i].max} 点
          </ExampartScore>
        </ScoreContainer>
      ))}

      {examination.answeredAt !== null && (
        <>
          <CardContainer cardWidth={312} cardHeight={256}>
            {examquestions.map((examquestion, i) => {
              const question = questionUuidToQuestion[examquestion.question];
              if (!question) throw new Error();
              const isCorrect = examquestion.examineeAnswer === question.answer;
              return (
                <QuestionCard
                  key={question.uuid}
                  statement={question.statement}
                  figure={question.figure}
                  selections={examquestion.answerOrder.map((i) => ({
                    text: question.selections[i],
                    color: i === question.answer ? "red" : i === examquestion.examineeAnswer ? "blue" : "lightgray",
                  }))}
                  borderColor={isCorrect ? "red" : "blue"}
                  header={
                    <QuestionCardHeader>
                      <QuestionCardIndex>{i + 1}.</QuestionCardIndex>
                    </QuestionCardHeader>
                  }
                  footer={
                    <QuestionCardInfoContainer>
                      <QuestionCardInfo>分野 {exampartUuidToIndex[examquestion.exampart]! + 1}</QuestionCardInfo>
                      <QuestionCardInfo>配点 {question.point}</QuestionCardInfo>
                    </QuestionCardInfoContainer>
                  }
                />
              );
            })}
          </CardContainer>
        </>
      )}
    </Layout>
  );
}

const WrappedPageTitle = styled(PageTitle)`
  display: flex;
  align-items: center;
`;

const ExaminationDate = styled.span`
  margin-left: 1rem;
  font-size: 1rem;
`;

const ScoreContainer = styled.div`
  margin-top: 4px;
  padding-bottom: 4px;
  display: grid;
  grid-template-columns: 3rem 1fr 8rem;
  gap: 1rem;

  & > *:nth-child(1) {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }

  & > *:nth-child(2) {
    display: flex;
    align-items: center;
  }

  & > *:nth-child(3) {
    text-align: right;
  }

  &:not(:last-child) {
    border-bottom: 1px solid lightgray;
  }
`;

const ScoreTitle = styled.span``;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const ToggleButtonWrapper = styled.div`
  pointer-events: none;
`;

const QuestionCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const QuestionCardIndex = styled.div`
  font-weight: bold;
`;

const QuestionCardInfoContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const QuestionCardInfo = styled.div``;

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const uuid = params?.uuid;
  if (typeof uuid !== "string") {
    return { notFound: true };
  }

  return await connectDatabase(async (client) => {
    const examination = await client.getExamination(uuid);
    if (examination === null) {
      return { notFound: true };
    }

    const tags: Tag[] = await client.getAllTags();
    const [examquestions, questions] = await client.getExamquestions(uuid);
    const examScore = await client.getExaminationScore(uuid);
    const props: Props = { tags, questions, examination, examquestions, examScore };
    return { props };
  });
};
