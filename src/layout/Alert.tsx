import { createContext, useContext } from "react";
import styled from "styled-components";

type AlertLevel = "info" | "error";

type AlertData = {
  level: AlertLevel;
  message: string;
  timerId: number;
};

const AlertContext = createContext<AlertData[]>([]);

export default function Alert() {
  const data = useContext(AlertContext);

  return <Container></Container>;
}

const Container = styled.div``;
