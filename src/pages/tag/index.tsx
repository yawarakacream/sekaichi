import { GetServerSideProps } from "next";
import { createRef, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useFetcher } from "../../api";
import { TagPost } from "../../api-impl";
import { connectDatabase } from "../../database";
import { Tag } from "../../item-type";
import { BasicButton, SubmitButton, TextInput } from "../../layout/Input";
import Layout, { PageTitle } from "../../layout/Layout";
import UpDownList from "../../layout/UpDownList";
import { PartialSome } from "../../utility";

interface ExtendedTag extends PartialSome<Tag, "uuid"> {
  numberOfQuestions: number;
}

interface Props {
  _tags: ExtendedTag[];
}

export default function TagPage({ _tags }: Props) {
  const [isFetching, fetch] = useFetcher();

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [tags, setTags] = useState<ExtendedTag[]>(_tags);

  const tagNameInputElements = useRef(tags.map(() => createRef<HTMLInputElement>()));
  const newTagNameInputElement = useRef<HTMLInputElement>(null);

  const moveTag = useCallback((from: number, to: number) => {
    if (from === to) return;
    setTags((tags) => {
      const tmp = tags[from];
      if (from < to) {
        for (let i = from; i < to; i++) {
          tags[i] = tags[i + 1];
        }
        tags[to] = tmp;
      } else {
        for (let i = from; i > to; i--) {
          tags[i] = tags[i - 1];
        }
        tags[to] = tmp;
      }
      tags.forEach((tag, i) => (tag.index = i));
      return tags;
    });
  }, []);

  const deleteTag = useCallback((index: number) => {
    setTags((tags) =>
      tags
        .filter((_, i) => i !== index)
        .map((tag, i) => {
          tag.index = i;
          return tag;
        })
    );
  }, []);

  const addNewTag = useCallback(() => {
    if (!newTagNameInputElement.current) throw new Error();
    const name = newTagNameInputElement.current.value;
    setTags((tags) => {
      const newTag: PartialSome<ExtendedTag, "uuid"> = {
        index: tags.length,
        name,
        numberOfQuestions: 0,
      };
      return [...tags, newTag];
    });
    newTagNameInputElement.current.value = "";
  }, []);

  const toggleMode = async () => {
    if (isFetching) return;
    if (mode === "view") {
      setMode("edit");
    } else {
      const { statusCode } = await fetch(TagPost, { tags });
      if (statusCode !== 200) {
        location.reload();
      }
      setMode("view");
    }
  };

  return (
    <Layout title="タグ一覧">
      <PageTitle>タグ一覧</PageTitle>
      <Container isFetching={isFetching}>
        <UpDownList array={tags} onDragDrop={mode === "view" ? undefined : moveTag}>
          {(tag, i) => (
            <TagContainer>
              <TagName defaultValue={tag.name} disabled={mode !== "edit"} ref={tagNameInputElements.current[i]} />
              <TagInfo>
                {mode === "edit" && tag.numberOfQuestions === 0 ? (
                  <DeleteButton value="削除" onClick={() => deleteTag(i)} />
                ) : (
                  <span>{tag.numberOfQuestions} 問</span>
                )}
              </TagInfo>
            </TagContainer>
          )}
        </UpDownList>
        {mode === "edit" && (
          <TagContainer>
            <TagName placeholder="新しいタグ" ref={newTagNameInputElement} />
            <TagInfo>
              <BasicButton value="追加" onClick={addNewTag} />
            </TagInfo>
          </TagContainer>
        )}
        <SubmitButtonContainer>
          {mode === "view" ? (
            <BasicButton value="編集" onClick={toggleMode} />
          ) : (
            <SubmitButton value="保存" onClick={toggleMode} disabled={isFetching} />
          )}
        </SubmitButtonContainer>
      </Container>
    </Layout>
  );
}

const Container = styled.div<{ isFetching: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;

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

const SubmitButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const TagContainer = styled.div`
  width: calc(100% - (8px + 1px) * 2);
  height: 2.5rem;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid lightgray;
  border-radius: 4px;
  gap: 1rem;
`;

const TagName = styled.input.attrs({ type: "text" })`
  flex: 1;
  border: none;
  border-top: 1px solid white;
  border-bottom: 1px solid black;
  outline: none;
  font: inherit;
  color: black;

  &:disabled {
    background: white;
    border-color: white;
    color: inherit;
  }
`;

const TagInfo = styled.div`
  text-align: right;
  min-width: 4rem;
`;

const DeleteButton = styled(BasicButton)`
  height: fit-content;
  border-color: orangered;
  background-color: white;
  color: orangered;
  transition: background-color 0.1s ease, color 0.1s ease;

  &:hover {
    opacity: 100%;
    background-color: orangered;
    color: white;
  }
`;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return await connectDatabase(async (client) => {
    const tags: Tag[] = await client.getAllTags();
    const extendedTags: ExtendedTag[] = await Promise.all(
      tags.map(async (tag) => {
        const numberOfQuestions = await client.searchNumberOfQuestions(tag.uuid);
        return { numberOfQuestions, ...tag };
      })
    );
    const props: Props = { _tags: extendedTags };
    return { props };
  });
};
