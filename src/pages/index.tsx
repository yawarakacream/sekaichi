import { GetServerSideProps } from "next";
import Link from "next/link";
import styled from "styled-components";
import { Tag, Practice } from "../item-type";
import { CardContainer } from "../layout/Card";
import Layout, { PageTitle } from "../layout/Layout";

interface Props {
  tags: Tag[];
  practices: Practice[];
}

export default function Home({ tags, practices }: Props) {
  return (
    <Layout title={undefined}>
      <PageTitle>タグ</PageTitle>
      <CardContainer cardWidth={128} cardHeight={64}>
        <LinkCard href="/tag">確認・編集</LinkCard>
      </CardContainer>
      <PageTitle>問題</PageTitle>
      <CardContainer cardWidth={128} cardHeight={64}>
        <LinkCard href="/question">検索・編集</LinkCard>
        <LinkCard href="/question/edit">作成</LinkCard>
      </CardContainer>
    </Layout>
  );
}

const LinkCard = styled(Link)`
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid lightgray;
  border-radius: 4px;
  font-size: 1.1rem;
  color: darkblue;
  text-decoration: none;
  cursor: pointer;

  transition: opacity 0.1s ease;

  &:hover {
    opacity: 50%;
  }

  @media (max-width: 600px) {
    font-size: 1rem;
  }
`;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const tags: Tag[] = [];

  const practices: Practice[] = [];

  const props: Props = { tags, practices };
  return { props };
};
