import { Html, Head, Main, NextScript } from "next/document";
import { createGlobalStyle } from "styled-components";

export default function Document() {
  return (
    <Html lang="ja">
      <GlobalStyles />
      <Head />
      <body style={{ margin: 0, padding: 0, overflowY: "scroll" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    overflow-y: scroll;

    font-family: sans-serif;
    font-size: 16px;

    @media (max-width: 600px) {
      font-size: 14px;
    }
  }

  // for iOS Safari
  input {
    border-radius: 0;
    line-height: normal;
    -webkit-appearance: none;
  }
  input[type="text"] {
    padding: 1px 2px;
    opacity: 1;
    -webkit-text-fill-color: black;
  }
`;
