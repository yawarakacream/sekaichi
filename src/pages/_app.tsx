import type { AppProps } from "next/app";
import { createGlobalStyle } from "styled-components";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyles />
      <Component {...pageProps} />
    </>
  );
}

const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    overflow-y: scroll;
  }

  // for iOS Safari
  input {
    border-radius: 0;
    line-height: normal;
    -webkit-appearance: none;

    &[type="text"] {
      padding: 1px 2px;
      -webkit-text-fill-color: black;
      opacity: 1;
    }
  }
`;
