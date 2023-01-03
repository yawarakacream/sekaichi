import { ReactElement, useRef, useState } from "react";
import styled from "styled-components";

interface Props<T> {
  array: T[];
  onDragDrop?: (from: number, to: number) => void;
  children: (value: T, index: number) => ReactElement;
}

export default function UpDownList<T>({ array, onDragDrop, children }: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  return (
    <Container ref={containerRef}>
      {array.map((value, i) =>
        onDragDrop === undefined ? (
          <Item key={i} toBeSwitched={false}>
            {children(value, i)}
          </Item>
        ) : (
          <Item
            key={i}
            draggable={true}
            toBeSwitched={i === draggedIndex || i === draggedOverIndex}
            onDragStart={() => setDraggedIndex(i)}
            onDragEnd={() => {
              if (draggedIndex === null) throw new Error();
              if (draggedOverIndex === null) return;
              if (onDragDrop === undefined) throw new Error();
              onDragDrop(draggedIndex, draggedOverIndex);
              setDraggedIndex(null);
              setDraggedOverIndex(null);
            }}
            onDragEnter={() => setDraggedOverIndex(i)}
            onDragOver={(event) => event.preventDefault()}
          >
            {children(value, i)}
          </Item>
        )
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Item = styled.div<{ toBeSwitched: boolean }>`
  position: relative;
  height: fit-content;
  z-index: 0;
  display: flex;
  align-items: center;
  opacity: ${(p) => (p.toBeSwitched ? 0.25 : 1)};
`;
