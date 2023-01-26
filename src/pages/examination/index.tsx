import { GetServerSideProps } from "next";
import Link from "next/link";
import { useMemo } from "react";
import styled from "styled-components";
import { connectDatabase } from "../../database";
import { Examination, ExaminationScore, Tag, UUID } from "../../item-type";
import { Card } from "../../layout/Card";
import { LinkButton } from "../../layout/Input";
import Layout, { PageTitle } from "../../layout/Layout";
import { formatDate } from "../../utility";

export const percentToColor = (percent: number) => {
  const d = Math.floor(percent / 10) / 10;
  const result = [d * d * 255, 0, ((1 - d * d) * 255) / 2];
  return `rgb(${result.join(", ")})`;
};

export const scoreToPercent = (score: ExaminationScore) => {
  const toPercent = (max: number, examinee: number) => Math.floor((examinee / max) * 100);
  return {
    sum: toPercent(score.sum.max, score.sum.examinee),
    parts: score.parts.map(({ max, examinee }) => toPercent(max, examinee)),
  };
};

interface Props {
  tags: Tag[];
  examinations: Examination[];
  scores: ExaminationScore[];
}

export default function ExaminationPage({ tags, examinations, scores }: Props) {
  const tagsUuidToName: { [key in UUID]?: string } = useMemo(() => {
    return tags.reduce((acc, curr) => {
      acc[curr.uuid] = curr.name;
      return acc;
    }, {} as { [key in UUID]?: string });
  }, [tags]);

  const percentageScores = useMemo(() => scores.map((score) => scoreToPercent(score)), [scores]);

  return (
    <Layout title="模試一覧">
      <PageTitle>模試一覧</PageTitle>
      <Container>
        {examinations.map((e, i) => {
          return (
            <ExaminationCard key={e.uuid}>
              <ExaminationInfo>
                <ExaminationTitle>
                  <ExaminationName href={`/examination/view/${e.uuid}`}>{e.name}</ExaminationName>
                  <ExaminationDate>
                    {e.answeredAt ? (
                      <span>@ {formatDate(new Date(e.answeredAt))}</span>
                    ) : (
                      <LinkButton href={`/examination/take/${e.uuid}`}>受験する</LinkButton>
                    )}
                  </ExaminationDate>
                </ExaminationTitle>
                <ExaminationSumScore color={percentToColor(percentageScores[i].sum)}>
                  {percentageScores[i].sum} %
                </ExaminationSumScore>
              </ExaminationInfo>
              <ExampartContainer>
                {e.examparts.map((part, j) => {
                  return (
                    <Exampart key={part.uuid}>
                      <ExampartTagContainer>
                        {part.tags.map((tag) => tagsUuidToName[tag]).join(" & ")}
                      </ExampartTagContainer>
                      <ExampartScore color={percentToColor(percentageScores[i].parts[j])}>
                        {percentageScores[i].parts[j]} %
                      </ExampartScore>
                    </Exampart>
                  );
                })}
              </ExampartContainer>
            </ExaminationCard>
          );
        })}
      </Container>
    </Layout>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ExaminationCard = styled(Card)`
  width: 100%;
  padding: 4px 8px;
  box-sizing: border-box;
`;

const ExaminationInfo = styled.div`
  width: 100%;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const ExaminationTitle = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
`;

const ExaminationName = styled(Link)`
  margin: 0;
  padding: 0;
  font: inherit;
  font-size: 1.2rem;
  font-weight: bold;
  color: darkblue;
  text-decoration: inherit;
  user-select: none;
  cursor: pointer;
  transition: opacity 0.1s ease;

  &:hover {
    opacity: 50%;
  }
`;

const ExaminationDate = styled.div`
  font-size: 1rem;
`;

export const ExaminationSumScore = styled.div<{ color: string }>`
  color: ${(p) => p.color};
  font-size: 1.2rem;
  font-weight: bold;
`;

const ExampartContainer = styled.div`
  border-top: 1px solid lightgray;
`;

const Exampart = styled.div`
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
`;

const ExampartTagContainer = styled.div``;

export const ExampartScore = styled.div<{ color: string }>`
  color: ${(p) => p.color};
`;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return await connectDatabase(async (client) => {
    const tags: Tag[] = await client.getAllTags();
    const examinations: Examination[] = await client.getAllExaminations().then((array) => array.reverse());
    const scores: ExaminationScore[] = await Promise.all(
      examinations.map((exam) => client.getExaminationScore(exam.uuid))
    );
    const props: Props = { tags, examinations, scores };
    return { props };
  });
};
