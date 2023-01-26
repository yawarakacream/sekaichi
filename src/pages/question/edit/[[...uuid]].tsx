import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { createRef, useEffect, useId, useRef } from "react";
import styled from "styled-components";
import { useFetcher } from "../../../api";
import { QuestionPost, QuestionPut } from "../../../api-impl";
import { connectDatabase } from "../../../database";
import { isQuestionWithoutUuid, NUMBER_OF_SELECTIONS, Question, Tag } from "../../../item-type";
import {
  ImageInput,
  InputContainer,
  NumberInput,
  RadioButton,
  SubmitButton,
  TextArea,
  TextInput,
  ToggleButton,
} from "../../../layout/Input";
import Layout, { PageTitle } from "../../../layout/Layout";
import { range } from "../../../utility";

interface Props {
  question: Question | "null";
  tags: Tag[];
}

export default function QuestionEditPage({ question, tags }: Props) {
  const isNewQuestion = question === "null";

  const router = useRouter();
  const [isFetching, fetch] = useFetcher();

  const formElement = useRef<HTMLFormElement>(null);
  const tagInputElements = useRef(tags.map(() => createRef<HTMLInputElement>()));
  const statementInputElement = useRef<HTMLTextAreaElement>(null);
  const selectionInputElements = useRef(range(NUMBER_OF_SELECTIONS).map(() => createRef<HTMLInputElement>()));
  const answerInputElementsName = useId();
  const answerInputElements = useRef(range(NUMBER_OF_SELECTIONS).map(() => createRef<HTMLInputElement>()));
  const pointInputElement = useRef<HTMLInputElement>(null);
  const figureInput = useRef<string | null>(null);

  useEffect(() => {
    tagInputElements.current.forEach((el, i) => {
      if (!el.current) throw new Error();
      el.current.checked = question === "null" ? false : question.tags.includes(tags[i].uuid);
    });

    if (!statementInputElement.current) throw new Error();
    statementInputElement.current.value = question === "null" ? "" : question.statement;

    selectionInputElements.current.forEach((el, i) => {
      if (!el.current) throw new Error();
      el.current.value = question === "null" ? "" : question.selections[i];
    });

    answerInputElements.current.forEach((el, i) => {
      if (!el.current) throw new Error();
      el.current.checked = question === "null" ? i === 0 : i === question.answer;
    });

    if (!pointInputElement.current) throw new Error();
    pointInputElement.current.value = question === "null" ? "" : question.point.toString();

    figureInput.current = question === "null" ? null : question.figure;
  }, [question]);

  const submit = async () => {
    if (isFetching) return;
    if (!formElement.current?.checkValidity()) return;

    const isTagUsed = tagInputElements.current.map((el) => {
      if (!el.current) throw new Error();
      return el.current.checked;
    });

    if (!statementInputElement.current) throw new Error();
    const statement = statementInputElement.current.value;

    const selections = selectionInputElements.current.map((el) => {
      if (!el.current) throw new Error();
      return el.current.value;
    });

    const answer = answerInputElements.current.findIndex((el) => {
      if (!el.current) throw new Error();
      return el.current.checked;
    });

    if (!pointInputElement.current) throw new Error();
    const point = Number(pointInputElement.current.value);

    const figure = figureInput.current;

    const createdAt = Date.now();

    const newQuestion: Record<keyof Omit<Question, "uuid">, unknown> = {
      tags: tags.filter((_, i) => isTagUsed[i]).map((tag) => tag.uuid),
      statement,
      selections,
      answer,
      point,
      figure,
      createdAt,
    };
    if (!isQuestionWithoutUuid(newQuestion)) throw new Error();

    if (isNewQuestion) {
      const { statusCode, body } = await fetch(QuestionPost, { question: newQuestion });
      if (statusCode !== 201) throw new Error(`status code: ${statusCode}`);
      router.push(`/question/edit/${body.uuid}`);
    } else {
      const { statusCode } = await fetch(QuestionPut, { question: { uuid: question.uuid, ...newQuestion } });
      if (statusCode !== 201) throw new Error(`status code: ${statusCode}`);
    }
  };

  return (
    <Layout title={`問題を${isNewQuestion ? "新規作成する" : "編集する"}`}>
      <PageTitle>{`問題を${isNewQuestion ? "新規作成する" : "編集する"}`}</PageTitle>
      <Form ref={formElement} isFetching={isFetching}>
        <InputContainer label="タグ">
          <TagContainer>
            {tags.map((t, i) => (
              <ToggleButton key={t.uuid} ref={tagInputElements.current[i]}>
                {t.name}
              </ToggleButton>
            ))}
          </TagContainer>
        </InputContainer>
        <InputContainer label="問題文">
          <StatementInput ref={statementInputElement} required />
        </InputContainer>
        <InputContainer label="選択肢">
          <SelectionContainer>
            {[...Array(NUMBER_OF_SELECTIONS).keys()].map((i) => (
              <SelectionWrapper key={i}>
                <SelectionIndexContainer>
                  <RadioButton
                    name={answerInputElementsName}
                    value={i.toString()}
                    defaultChecked={i === 0}
                    ref={answerInputElements.current[i]}
                  >
                    {(i + 1).toString()}
                  </RadioButton>
                </SelectionIndexContainer>
                <SelectionInput key={i} ref={selectionInputElements.current[i]} required />
              </SelectionWrapper>
            ))}
          </SelectionContainer>
        </InputContainer>
        <InputContainer label="配点">
          <PointInputContainer>
            <NumberInput min={0} max={10} step={1} ref={pointInputElement} required />点
          </PointInputContainer>
        </InputContainer>
        <InputContainer label="図">
          <FigureInputContainer>
            <ImageInput base64Ref={figureInput} />
          </FigureInputContainer>
        </InputContainer>
        <SubmitButtonContainer>
          <SubmitButton value="保存" onClick={submit} disabled={isFetching} />
        </SubmitButtonContainer>
      </Form>
    </Layout>
  );
}

const Form = styled.form<{ isFetching: boolean }>`
  z-index: 0;

  &:before {
    content: "";
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1;
    background-color: rgba(0, 0, 0, 0.3);
    pointer-events: ${(p) => (p.isFetching ? "initial" : "none")};
    opacity: ${(p) => (p.isFetching ? 1 : 0)};
    transition: opacity 0.1s ease 0.1s;
  }
`;

const TagContainer = styled.div`
  margin: 4px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const StatementInput = styled(TextArea)`
  min-height: 5rem;
  flex: 1;
`;

const SelectionContainer = styled.div`
  flex: 1;
`;

const SelectionWrapper = styled.div`
  &:not(:first-child) {
    margin-top: 4px;
  }
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const SelectionIndexContainer = styled.div`
  width: calc(1.75rem);
  height: calc(1.75rem);
  margin-right: 8px;
`;

const SelectionInput = styled(TextInput)`
  flex: 1;
`;

const PointInputContainer = styled.div`
  width: 5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
`;

const SubmitButtonContainer = styled.div`
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FigureInputContainer = styled.div`
  min-height: 32px;
  min-width: 32px;
`;

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const uuid = params?.uuid?.[0];
  if (uuid && typeof uuid !== "string") {
    return { notFound: true };
  }

  return await connectDatabase(async (client) => {
    const tags: Tag[] = await client.getAllTags();
    const question: Question | "null" = uuid === undefined ? "null" : (await client.getQuestion(uuid)) ?? "null";

    const props: Props = { tags, question };
    return { props };
  });
};
