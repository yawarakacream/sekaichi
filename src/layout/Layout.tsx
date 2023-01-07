import Head from "next/head";
import Link from "next/link";
import { createContext, PropsWithChildren, useContext } from "react";
import styled from "styled-components";

interface Props {
  title: string | undefined;
}

export default function Layout({ title, children }: PropsWithChildren<Props>) {
  return (
    <>
      <Head>
        <title>{title ? `${title} | 世界遺産一問一答` : "世界遺産一問一答"}</title>
        <meta name="description" content="世界遺産一問一答 by 🐿" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Header>
          <SiteTitle href="/">世界遺産一問一答</SiteTitle>
        </Header>
        <Main>{children}</Main>
      </Container>
    </>
  );
}

const Container = styled.main`
  width: 100%;
  min-height: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;

  font-family: sans-serif;
  font-size: 16px;

  @media (max-width: 600px) {
    font-size: 14px;
  }
`;

const Header = styled.header`
  position: relative;
  width: calc(100% - 12px * 2);
  height: 64px;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: lightsteelblue;
  text-align: left;
  user-select: none;

  @media (max-width: 600px) {
    width: calc(100% - 8px * 2);
    height: 48px;
    padding: 0 8px;
  }
`;

const SiteTitle = styled(Link)`
  width: fit-content;
  font-family: "ヒラギノ明朝 Pro W3", serif;
  font-size: calc(48px - 4px * 2 - 16px);
  font-weight: bold;
  color: black;
  text-decoration: none;
  cursor: pointer;
`;

const Main = styled.div`
  position: relative;
  width: 1024px;
  flex: 1;

  @media (max-width: 1024px) {
    width: calc(100% - 24px);
  }
`;

export const PageTitle = styled.div`
  width: 100%;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid green;
  font-size: 1.5rem;

  @media (max-width: 600px) {
    font-size: 1.2rem;
  }
`;
