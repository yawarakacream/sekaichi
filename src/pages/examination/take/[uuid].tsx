import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useFetcher } from "../../../api";
import { ExaminationTakePost } from "../../../api-impl";
import { connectDatabase } from "../../../database";
import { Examination, Examquestion, Question } from "../../../item-type";
import { ArrowButton, SubmitButton } from "../../../layout/Input";
import Layout, { PageTitle } from "../../../layout/Layout";

interface Props {
  questions: Question[];
  examination: Examination;
  examquestions: Examquestion[];
}

export default function ExaminationTakePage({ questions, examination, examquestions }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (examination.answeredAt !== null) {
      router.push(`/examination/view/${examination.uuid}`);
    }
  }, []);

  const [isFetching, fetch] = useFetcher();

  const [currentQuestionIndex, examineeAnswers] = (() => {
    const { qi, ea } = router.query;

    const currentQuestionIndex = typeof qi === "string" ? Number.parseInt(qi) : 0;
    if (!Number.isInteger(currentQuestionIndex)) throw new Error();
    if (!(0 <= currentQuestionIndex && currentQuestionIndex < examquestions.length)) throw new Error();

    const examineeAnswers = typeof ea === "string" ? (JSON.parse(ea) as number[]) : [];
    if (!(0 <= examineeAnswers.length && examineeAnswers.length <= examquestions.length)) throw new Error();
    if (examineeAnswers.some((ea) => ![0, 1, 2, 3].includes(ea))) throw new Error();

    return [currentQuestionIndex, examineeAnswers as (0 | 1 | 2 | 3)[]];
  })();

  const setExamineeAnswers = useCallback(
    (questionIndex: number, examineeAnswers: number[]) => {
      // push: 履歴に残る, replace: 履歴に残らない
      router.push(
        {
          pathname: `/examination/take/${examination.uuid}`,
          query: { qi: questionIndex, ea: JSON.stringify(examineeAnswers) },
        },
        undefined,
        { shallow: true }
      );
    },
    [router, examination]
  );
  const currentAnswer = examineeAnswers[currentQuestionIndex];
  const currentExamquestion = examquestions[currentQuestionIndex];
  const currentQuestion = questions[currentQuestionIndex];

  const submit = async () => {
    if (examineeAnswers.length !== examquestions.length) throw new Error();
    if (examineeAnswers.some((ea) => ![0, 1, 2, 3].includes(ea))) throw new Error();
    const { statusCode } = await fetch(ExaminationTakePost, {
      examinationUuid: examination.uuid,
      examineeAnswers,
    });
    if (statusCode !== 201) throw new Error(`status code: ${statusCode}`);
    router.push(`/examination/view/${examination.uuid}`);
  };

  return (
    <Layout title={`${examination.name} [${currentQuestionIndex + 1}] - 受験`}>
      <Container>
        <PageTitle>{`受験「${examination.name}」`}</PageTitle>
        <QuestionContainer>
          <MarubatsuOverlay
            type={
              currentAnswer === undefined
                ? undefined
                : currentAnswer === currentQuestion.answer
                ? "correct"
                : "incorrect"
            }
          />
          <Index>
            <span>問 {currentQuestionIndex + 1}</span>
            <span>全 {examquestions.length} 問</span>
          </Index>
          <Statement>{currentQuestion.statement}</Statement>
          {currentQuestion.figure && (
            <FigureContainer>
              <Figure src={currentQuestion.figure} />
            </FigureContainer>
          )}
          <ButtonContainer>
            <SelectionsContainer>
              {currentExamquestion.answerOrder.map((i) => (
                <Selection
                  key={i}
                  borderColor={
                    currentAnswer === undefined
                      ? "lightgray"
                      : i === currentQuestion.answer
                      ? "red"
                      : i === currentAnswer
                      ? "blue"
                      : "lightgray"
                  }
                  onClick={() => {
                    let newAnswers: (0 | 1 | 2 | 3)[];
                    if (currentQuestionIndex < examineeAnswers.length) {
                      newAnswers = [...examineeAnswers];
                      newAnswers[currentQuestionIndex] = i;
                    } else {
                      newAnswers = [...examineeAnswers, i];
                    }
                    setExamineeAnswers(currentQuestionIndex, newAnswers);
                  }}
                >
                  {currentQuestion.selections[i]}
                </Selection>
              ))}
            </SelectionsContainer>
            <ArrowButtonsContainer>
              <ArrowToPreviousButtonWrapper show={0 < currentQuestionIndex}>
                <ArrowButton type="left" onClick={() => setExamineeAnswers(currentQuestionIndex - 1, examineeAnswers)}>
                  前
                </ArrowButton>
              </ArrowToPreviousButtonWrapper>
              {currentAnswer !== undefined &&
                (currentQuestionIndex < examquestions.length - 1 ? (
                  <ArrowButton
                    type="right"
                    onClick={() => setExamineeAnswers(currentQuestionIndex + 1, examineeAnswers)}
                  >
                    次
                  </ArrowButton>
                ) : (
                  <SubmitButton value="結果を見る" onClick={submit} disabled={isFetching} />
                ))}
            </ArrowButtonsContainer>
          </ButtonContainer>
        </QuestionContainer>
      </Container>
    </Layout>
  );
}

const Container = styled.div`
  position: absolute;
  width: 100%;
  height: calc(100% - 1rem);
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
`;

const QuestionContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MarubatsuOverlay = memo(({ type }: { type: "correct" | "incorrect" | undefined }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState(0);
  const updateSize = useCallback(() => {
    if (!containerRef.current) throw new Error();
    setSize(Math.min(containerRef.current.offsetWidth, containerRef.current.offsetHeight));
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <OverlayContainer ref={containerRef}>
      {type === "correct" && <CorrectOverlay size={size} />}
      {type === "incorrect" && <IncorrectOverlay size={size} />}
    </OverlayContainer>
  );
});

const OverlayContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 40%;
  pointer-events: none;

  & > * {
    animation: show 0.15s both;
    @keyframes show {
      0% {
        transform: scale(0.98);
        opacity: 0;
      }
      50% {
        transform: scale(1);
        opacity: 100%;
      }
      100% {
        transform: scale(0.98);
        opacity: 70%;
      }
    }
  }
`;

const CorrectOverlay = styled.div<{ size: number }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    width: ${(p) => p.size * 0.9}px;
    height: ${(p) => p.size * 0.9}px;
    box-sizing: border-box;
    border: ${(p) => p.size * 0.12}px solid red;
    border-radius: 50%;
    content: "";
  }
`;

const IncorrectOverlay = styled.div<{ size: number }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before,
  &::after {
    position: absolute;
    width: ${(p) => p.size}px;
    height: ${(p) => p.size * 0.12}px;
    background-color: blue;
    content: "";
  }

  &:before {
    transform: rotate(-45deg);
  }

  &:after {
    transform: rotate(45deg);
  }
`;

const Index = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: bold;
`;

const Statement = styled.div``;

const FigureContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
`;

const Figure = styled.img`
  object-fit: cover;
`;

const ButtonContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 1rem;
`;

const SelectionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Selection = styled.div<{ borderColor: string }>`
  width: 100%;
  padding: 4px 8px;
  box-sizing: border-box;
  border: 1px solid ${(p) => p.borderColor};
  border-radius: 4px;
  cursor: pointer;

  transition: opacity 0.1s ease;

  &:hover {
    opacity: 50%;
  }
`;

const ArrowButtonsContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const ArrowToPreviousButtonWrapper = styled.div<{ show: boolean }>`
  width: fit-content;
  height: fit-content;
  opacity: ${(p) => (p.show ? "100%" : "0")};
`;

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, query }) => {
  const uuid = params?.uuid;
  if (typeof uuid !== "string") {
    return { notFound: true };
  }

  return await connectDatabase(async (client) => {
    const examination = await client.getExamination(uuid);
    if (examination === null) {
      return { notFound: true };
    }

    const [examquestions, questions] = await client.getExamquestions(uuid);
    const props: Props = { questions, examination, examquestions };
    return { props };
  });
};
