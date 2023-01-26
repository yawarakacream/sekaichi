import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { createRef, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useFetcher } from "../../api";
import { ExaminationPost, QuestionSearchPost } from "../../api-impl";
import { connectDatabase } from "../../database";
import { Tag } from "../../item-type";
import { NumberInput, SubmitButton, TextInput, ToggleButton, BasicButton, InputContainer } from "../../layout/Input";
import Layout, { PageTitle } from "../../layout/Layout";
import { range } from "../../utility";

interface Props {
  tags: Tag[];
}

export default function ExaminationCreatePage({ tags }: Props) {
  const router = useRouter();
  const [isFetching, fetch] = useFetcher();

  const [partCount, setPartCount] = useState(1);
  const addPart = useCallback(() => {
    setPartCount((i) => i + 1);
  }, []);

  const [isTagExcluded, setIsTagExcluded] = useState<boolean[]>(tags.map(() => false));
  const toggleTagExcluded = useMemo(() => {
    return tags.map(
      (_, i) => () =>
        setIsTagExcluded((current) => {
          const next = [...current];
          next[i] = !next[i];
          return next;
        })
    );
  }, [tags]);

  const formElement = useRef<HTMLFormElement>(null);
  const nameInputElement = useRef<HTMLInputElement>(null);
  const partTagInputElements = useRef(range(partCount).map(() => tags.map(() => createRef<HTMLInputElement>())));
  const partSizeInputElement = useRef(range(partCount).map(() => createRef<HTMLInputElement>()));

  useEffect(() => {
    partTagInputElements.current.push(tags.map(() => createRef<HTMLInputElement>()));
    partSizeInputElement.current.push(createRef<HTMLInputElement>());
  }, [partCount]);

  const submit = async () => {
    if (isFetching) return;
    if (!formElement.current?.checkValidity()) return;

    if (!nameInputElement.current) throw new Error();
    const name = nameInputElement.current.value;
    const tagsExcluded = tags.filter((_, i) => isTagExcluded[i]).map((tag) => tag.uuid);
    const parts = range(partCount).map((partIndex) => {
      if (!partTagInputElements.current[partIndex]) throw new Error();
      const partTags = tags
        .filter((_, i) => {
          const el = partTagInputElements.current[partIndex][i];
          if (!el?.current) throw new Error();
          return el.current.checked;
        })
        .map((tag) => tag.uuid);
      const el = partSizeInputElement.current[partIndex].current;
      if (!el) throw new Error();
      const partSize = Number.parseInt(el.value);
      return { tags: partTags, size: partSize };
    });

    const { statusCode, body } = await fetch(ExaminationPost, { name, tagsExcluded, parts });
    if (statusCode !== 201) throw new Error(`status code: ${statusCode}`);
    router.push(`/examination/view/${body.uuid}`);
  };

  return (
    <Layout title="模試作成">
      <PageTitle>模試を作成する</PageTitle>
      <Form ref={formElement}>
        <InputContainer label="模試名">
          <TextInput ref={nameInputElement} required />
        </InputContainer>
        <InputContainer label="除外タグ">
          <TagContainer>
            {tags.map((t, i) => (
              <ToggleButton key={t.uuid} style="negative" onChange={toggleTagExcluded[i]}>
                {t.name}
              </ToggleButton>
            ))}
          </TagContainer>
        </InputContainer>
        <InputContainer label="大問">
          <PartList>
            {range(partCount).map((partIndex) => {
              return (
                <Part
                  key={partIndex}
                  isTagExcluded={isTagExcluded}
                  tags={tags}
                  index={partIndex}
                  tagInputElements={partTagInputElements.current[partIndex]}
                  sizeInputElement={partSizeInputElement.current[partIndex]}
                />
              );
            })}
            <PartContainer>
              <BasicButton value="＋" onClick={addPart} />
            </PartContainer>
          </PartList>
        </InputContainer>
        <SubmitButtonContainer>
          <SubmitButton value="作成" onClick={submit} disabled={isFetching} />
        </SubmitButtonContainer>
      </Form>
    </Layout>
  );
}

const Form = styled.form``;

const SubmitButtonContainer = styled.div`
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const PartList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

interface PartProps {
  tags: Tag[];
  isTagExcluded: boolean[];
  index: number;
  tagInputElements: RefObject<HTMLInputElement>[];
  sizeInputElement: RefObject<HTMLInputElement>;
}

const Part = ({ tags, isTagExcluded, index, tagInputElements, sizeInputElement }: PartProps) => {
  const [isFetching, fetch] = useFetcher();

  const [maxSize, setMaxSize] = useState(0);
  const updateMaxSize = useCallback(async () => {
    if (isFetching) return;

    if (!sizeInputElement.current) throw new Error();
    sizeInputElement.current.value = "";

    const tagsIncluded = tags
      .filter((_, i) => {
        const el = tagInputElements[i];
        if (!el?.current) throw new Error();
        return el.current.checked;
      })
      .map((tag) => tag.uuid);
    const tagsExcluded = tags.filter((_, i) => isTagExcluded[i]).map((tag) => tag.uuid);

    if (tagsIncluded.length === 0 && tagsExcluded.length > 0) {
      setMaxSize(0);
    } else {
      const { statusCode, body } = await fetch(QuestionSearchPost, { tagsIncluded, tagsExcluded });
      if (statusCode !== 200) throw new Error(`status code: ${statusCode}`);
      setMaxSize(body.questions.length);
    }
  }, [tags, isTagExcluded, tagInputElements, sizeInputElement]);

  useEffect(() => {
    updateMaxSize();
    isTagExcluded.forEach((value, index) => {
      if (value) {
        const el = tagInputElements[index].current;
        if (!el) throw new Error();
        el.checked = false;
      }
    });
  }, [isTagExcluded, tagInputElements]);

  return (
    <PartContainer>
      <PartTitle>{index + 1}</PartTitle>
      <PartInputContainer>
        <TagContainer>
          {tags.map((t, i) => (
            <PartTagWrapper key={t.uuid} hidden={isTagExcluded[i]}>
              <ToggleButton ref={tagInputElements[i]} onChange={updateMaxSize}>
                {t.name}
              </ToggleButton>
            </PartTagWrapper>
          ))}
        </TagContainer>
        <PartSizeContainer>
          {maxSize} 問中
          <PartSizeInput min={1} max={maxSize} step={1} ref={sizeInputElement} required disabled={isFetching} /> 問
        </PartSizeContainer>
      </PartInputContainer>
    </PartContainer>
  );
};

const PartContainer = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: 0.5rem;
`;

const PartTitle = styled.div`
  padding: 4px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

const PartInputContainer = styled.div`
  flex: 1;
  box-sizing: border-box;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid lightgray;
  border-radius: 4px;
`;

const PartTagWrapper = styled.div<{ hidden: boolean }>`
  display: ${(p) => (p.hidden ? "none" : "inherit")};
`;

const PartSizeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PartSizeInput = styled(NumberInput)`
  width: 2rem;
`;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return await connectDatabase(async (client) => {
    const tags: Tag[] = await client.getAllTags();
    const props: Props = { tags };
    return { props };
  });
};
