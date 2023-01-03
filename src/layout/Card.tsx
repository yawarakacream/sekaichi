import styled from "styled-components";

export const Card = styled.div`
  border: 1px solid lightgray;
  border-radius: 4px;
  overflow: hidden;
`;

export const ButtonCard = styled(Card)`
  user-select: none;
  cursor: pointer;
  transition: opacity 0.1s ease;

  &:hover {
    opacity: 50%;
  }
`;

export const PlusButtonCard = styled(ButtonCard)`
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:before {
    content: "＋";
    font-size: 1.5rem;
    color: gray;
  }
`;

export const CardContainer = styled.div<{ cardWidth: number; cardHeight: number }>`
  margin: 1em 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${(p) => p.cardWidth}px, 1fr));
  grid-auto-rows: minmax(${(p) => p.cardHeight}px, max-content);
  gap: 1rem;
`;
