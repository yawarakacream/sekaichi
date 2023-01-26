import { GetServerSideProps } from "next";
import Link from "next/link";
import { createRef, useCallback, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useFetcher } from "../../api";
import { QuestionSearchPost } from "../../api-impl";
import { connectDatabase } from "../../database";
import { Question, Tag, UUID } from "../../item-type";
import { CardContainer } from "../../layout/Card";
import { SubmitButton, TextInput, ToggleButton } from "../../layout/Input";
import Layout, { PageTitle } from "../../layout/Layout";
import QuestionCard from "../../layout/QuestionCard";
import { formatDate } from "../../utility";

interface Props {
  tags: Tag[];
}

export default function QuestionPage({ tags }: Props) {
  const uuidToTag: { [uuid in UUID]?: Tag } = useMemo(
    () =>
      tags.reduce((acc, curr) => {
        acc[curr.uuid] = curr;
        return acc;
      }, {} as { [uuid in UUID]?: Tag }),
    [tags]
  );

  const [isFetching, fetch] = useFetcher();
  const [searchResult, setSearchResult] = useState<Question[] | undefined>(undefined);

  const searchTagInputElements = useRef(tags.map(() => createRef<HTMLInputElement>()));
  const searchFreewordsElement = useRef<HTMLInputElement>(null);
  const getFreewordsRegex = (mode: "and" | "or") => {
    if (!searchFreewordsElement.current) throw new Error();
    const splitted = searchFreewordsElement.current.value.replaceAll("　", " ").split(" ");
    if (mode === "and") {
      return new RegExp(splitted.map((s) => `(?=.*${s})`).join(""), "gis");
    } else {
      return new RegExp(splitted.join("|"), "gi");
    }
  };

  const onFreewordsInputKeypress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key.toLowerCase() === "enter") executeSearch();
  }, []);

  const executeSearch = useCallback(async () => {
    if (isFetching) return;

    if (!searchTagInputElements.current) throw new Error();
    if (!searchFreewordsElement.current) throw new Error();

    const searchTags = tags
      .filter((_, i) => {
        const el = searchTagInputElements.current[i]!;
        if (!el.current) throw new Error();
        return el.current.checked;
      })
      .map((tag) => tag.uuid);

    const { statusCode, body } = await fetch(QuestionSearchPost, { tagsIncluded: searchTags, tagsExcluded: [] });
    if (statusCode !== 200) throw new Error(`status code: ${statusCode}`);

    const { questions } = body;

    const freewordsRegex = getFreewordsRegex("and");
    setSearchResult(
      questions
        .filter((q) => {
          const str = [q.statement, ...q.selections].join(" ");
          return freewordsRegex.test(str);
        })
        .sort((a, b) => b.createdAt - a.createdAt)
    );
  }, []);

  return (
    <Layout title="問題を探す">
      <PageTitle>問題を探す</PageTitle>
      <Container>
        <ToggleButtonContainer>
          {tags.map((t, i) => (
            <ToggleButton key={t.uuid} ref={searchTagInputElements.current[i]}>
              {t.name}
            </ToggleButton>
          ))}
        </ToggleButtonContainer>
        <FreewordInput placeholder="フリーワード" ref={searchFreewordsElement} onKeyPress={onFreewordsInputKeypress} />
        <SubmitButtonContainer>
          <SubmitButton onClick={executeSearch} value="検索" disabled={isFetching} />
        </SubmitButtonContainer>
        <Divider />
        {searchResult && (
          <>
            <span>{isFetching ? "検索中" : `${searchResult.length} 件`}</span>
            <CardContainer cardWidth={312} cardHeight={256}>
              {searchResult.map((question) => {
                const freewordsRegex = getFreewordsRegex("or");
                const makeFreewordsStrong = (str: string) => {
                  return str.replaceAll(freewordsRegex, (s) => `<strong>${s}</strong>`);
                };
                return (
                  <QuestionCard
                    key={question.uuid}
                    statement={makeFreewordsStrong(question.statement)}
                    figure={question.figure}
                    selections={question.selections.map((s) => ({ text: makeFreewordsStrong(s) }))}
                    footer={
                      <QuestionCardInfoContainer>
                        <QuestionCardInfo>
                          <span>{question.tags.map((tag) => uuidToTag[tag]!.name).join(", ")}</span>
                          <span>
                            正答 {question.answer + 1} / 配点 {question.point}
                          </span>
                        </QuestionCardInfo>
                        <QuestionCardInfo>
                          <span>{formatDate(new Date(question.createdAt))}</span>
                          <QuestionCardEditButton href={`/question/edit/${question.uuid}`}>編集</QuestionCardEditButton>
                        </QuestionCardInfo>
                      </QuestionCardInfoContainer>
                    }
                  />
                );
              })}
            </CardContainer>
          </>
        )}
      </Container>
    </Layout>
  );
}

const Container = styled.div``;

const ToggleButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const FreewordInput = styled(TextInput)`
  margin: 16px 0;
  height: 1.5rem;
`;

const SubmitButtonContainer = styled.div`
  width: calc(100% - 4px * 2);
  margin: 8px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  margin: 1rem 0;
  background-color: lightgray;
`;

const QuestionCardInfoContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  font-size: 0.5rem;
  color: gray;
`;

const QuestionCardInfo = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const QuestionCardEditButton = styled(Link)`
  margin: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  text-decoration: inherit;
  user-select: none;
  cursor: pointer;
  transition: opacity 0.1s ease;

  &:hover {
    opacity: 50%;
  }
`;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return await connectDatabase(async (client) => {
    const tags: Tag[] = await client.getAllTags();
    const props: Props = { tags };
    return { props };
  });
};
