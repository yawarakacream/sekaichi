import { memo, ReactNode } from "react";
import styled from "styled-components";
import { Card } from "./Card";

interface Props {
  statement: string;
  figure?: string | null;
  selections: {
    text: string;
    color?: string;
  }[];
  borderColor?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

const QuestionCard = memo(({ statement, figure, selections, borderColor, header, footer }: Props) => {
  return (
    <Container borderColor={borderColor ?? "lightgray"}>
      {header}
      <Statement dangerouslySetInnerHTML={{ __html: statement }} />
      {figure && <Figure src={figure} />}
      <SelectionContainer>
        {selections.map((s, i) => (
          <Selection key={i} borderColor={s.color ?? "lightgray"} dangerouslySetInnerHTML={{ __html: s.text }} />
        ))}
      </SelectionContainer>
      {footer}
    </Container>
  );
});

export default QuestionCard;

const Container = styled(Card)<{ borderColor: string }>`
  position: relative;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-color: ${(p) => p.borderColor};
`;

const Statement = styled.div`
  min-height: 3rem;
  flex: 1;
  white-space: pre-wrap;
`;

const Figure = styled.img`
  width: 100%;
  object-fit: cover;
`;

const SelectionContainer = styled.div`
  height: fit-content;
  padding-top: 0.5rem;
  padding-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Selection = styled.div<{ borderColor: string }>`
  padding: 1px 8px;
  border: 1px solid ${(p) => p.borderColor};
  border-radius: 4px;
`;
