import Link from "next/link";
import React, { ChangeEvent, forwardRef, memo, MutableRefObject, useCallback, useEffect, useId, useState } from "react";
import styled from "styled-components";

export const TextInput = styled.input.attrs({ type: "text" })`
  width: calc(100% - (8px + 1px) * 2);
  margin: 0;
  padding: 4px 8px;
  display: block;
  border: 1px solid lightgray;
  border-radius: 4px;
  outline: none;
  font: inherit;

  &:invalid {
    border-color: red;
  }
`;

export const NumberInput = styled.input.attrs({ type: "number" })`
  width: calc(100% - (8px + 1px) * 2);
  margin: 0;
  padding: 4px 8px;
  display: block;
  border: 1px solid lightgray;
  border-radius: 4px;
  outline: none;
  font: inherit;

  &:invalid {
    border-color: red;
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  margin: 0;
  padding: 4px 8px;
  box-sizing: border-box;
  display: block;
  border: 1px solid lightgray;
  border-radius: 4px;
  outline: none;
  font: inherit;

  &:invalid {
    border-color: red;
  }
`;

export const InputContainer = styled.div<{ label: string }>`
  margin: 1em 0;
  display: flex;
  gap: 1rem;

  &:before {
    display: flex;
    align-items: center;
    width: 64px;
    content: "${(p) => p.label}";
    color: blue;
  }

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

export const BasicButton = styled.input.attrs({ type: "button" })`
  padding: 4px 12px;
  border: 1px solid royalblue;
  border-radius: 4px;
  outline: none;
  background-color: white;
  font: inherit;
  color: royalblue;
  cursor: pointer;
  user-select: none;

  transition: opacity 0.1s ease;

  &:hover {
    opacity: 50%;
  }

  &:disabled {
    opacity: 50%;
    pointer-events: none;
  }

  -webkit-appearance: none;
`;

export const SubmitButton = styled(BasicButton)`
  border-color: royalblue;
  background-color: royalblue;
  color: white;

  form:invalid & {
    opacity: 50%;
    pointer-events: none;
  }
`;

export const LinkButton = styled(Link)`
  margin: 0;
  padding: 4px 12px;
  border: 1px solid orange;
  border-radius: 4px;
  outline: none;
  background-color: white;
  font: inherit;
  color: orange;
  cursor: pointer;
  user-select: none;
  text-decoration: none;

  transition: background-color 0.1s ease, color 0.1s ease;

  &:hover {
    background-color: orange;
    color: white;
  }
`;

interface ToggleButtonProps {
  checked?: boolean;
  onChange?: () => void;
  children: string;
  style?: "positive" | "negative";
}

export const ToggleButton = forwardRef<HTMLInputElement, ToggleButtonProps>(
  ({ checked, onChange, children, style = "positive" }, ref) => {
    const id = useId();

    return (
      <ToggleButtonContainer type={style}>
        <input
          id={id}
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={onChange}
          readOnly={checked !== undefined && onChange === undefined ? true : undefined}
        />
        <label htmlFor={id}>{children}</label>
      </ToggleButtonContainer>
    );
  }
);

const ToggleButtonContainer = styled.span<{ type: "positive" | "negative" }>`
  & > input {
    display: none;
  }

  & > label {
    display: inline-block;
    padding: 4px 8px;
    background-color: white;
    border: 1px solid lightgray;
    border-radius: 4px;
    overflow: none;
    user-select: none;
    cursor: pointer;
  }

  & > input:checked + label {
    background-color: ${(p) => (p.type === "positive" ? "lightcyan" : "white")};
    border: 1px solid ${(p) => (p.type === "positive" ? "darkgray" : "lightgray")};
    color: ${(p) => (p.type === "positive" ? "black" : "lightgray")};
    text-decoration-line: ${(p) => (p.type === "positive" ? "none" : "line-through")};
  }
`;

interface RadioButtonProps {
  name: string;
  value: string;
  defaultChecked: boolean;
  children: string;
}

export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(({ children, ...props }, ref) => {
  const id = useId();

  return (
    <RadioButtonContainer>
      <input id={id} type="radio" ref={ref} {...props} />
      <label htmlFor={id}>{children}</label>
    </RadioButtonContainer>
  );
});

const RadioButtonContainer = styled.div`
  width: 100%;
  height: 100%;

  & > input {
    display: none;
  }

  & > label {
    width: 100%;
    height: 100%;
    box-sizing: border-box;

    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border: 1px solid lightgray;
    border-radius: 50%;
    user-select: none;
    cursor: pointer;
  }

  & > input:checked + label {
    background-color: lightcyan;
    border: 1px solid darkgray;
  }
`;

interface ArrowButtonProps {
  onClick?: () => void;
  children: string;
  type: "left" | "right";
}

export const ArrowButton = memo(({ onClick, children, type }: ArrowButtonProps) => {
  const id = useId();

  return (
    <ArrowButtonContainer type={type}>
      <input id={id} type="button" onClick={onClick} />
      <label htmlFor={id}>{children}</label>
    </ArrowButtonContainer>
  );
});

const ArrowButtonContainer = styled.span<{ type: "left" | "right" }>`
  & > input {
    display: none;
  }

  & > label {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    ${(p) => `padding-${p.type}`}: 24px;
    background-color: white;
    border: 1px solid green;
    border-radius: 4px;
    overflow: none;
    user-select: none;
    cursor: pointer;
    color: green;

    transition: background-color 0.1s ease, color 0.1s ease;

    &:before {
      position: absolute;
      ${(p) => `${p.type}`}: 10px;
      width: 0.6rem;
      height: 0.6rem;
      border-left: 2px solid green;
      border-top: 2px solid green;
      transform: rotate(${(p) => (p.type === "left" ? "-45deg" : "135deg")});
      content: "";
    }

    &:hover {
      background-color: green;
      color: white;

      &:before {
        border-color: white;
      }
    }
  }
`;

interface ImageInputProps {
  base64Ref: MutableRefObject<string | null>;
}

export const ImageInput = memo(({ base64Ref }: ImageInputProps) => {
  const [isLoading, setLoading] = useState(false);
  const [base64Data, _setBase64Data] = useState<string | null>(base64Ref.current);
  const setBase64Data = useCallback((base64: string | null) => {
    _setBase64Data(base64);
    base64Ref.current = base64;
  }, []);
  useEffect(() => setBase64Data(base64Ref.current), []);

  const onInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setBase64Data(null);
      return;
    }

    if (isLoading) return;
    setLoading(true);

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") throw new Error();

      setBase64Data(result);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const onRemoveButtonClicked = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setBase64Data(null);
  }, []);

  return base64Data === null ? (
    <ImageInputContainerForNoImage>
      <label>
        <span>画像を選択する</span>
        <input type="file" accept="image/*" onChange={onInputChange} disabled={isLoading} />
      </label>
    </ImageInputContainerForNoImage>
  ) : (
    <ImageInputContainerForSelectedImage>
      <button onClick={onRemoveButtonClicked}>×</button>
      <label>
        <img src={base64Data} />
        <input type="file" accept="image/*" onChange={onInputChange} disabled={isLoading} />
      </label>
    </ImageInputContainerForSelectedImage>
  );
});

const ImageInputContainerAbstract = styled.div`
  position: relative;
  z-index: 0;

  & > * {
    transition: opacity 0.1s ease;
    &:hover {
      opacity: 50%;
    }
  }

  & > label {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid lightgray;
    border-radius: 4px;
    outline: none;
    font: inherit;
    color: gray;
    cursor: pointer;

    &:invalid {
      border-color: red;
    }

    & > input {
      display: none;
    }
  }
`;

const ImageInputContainerForSelectedImage = styled(ImageInputContainerAbstract)`
  width: calc(100% - (1.6rem - 1px * 2) / 2);
  height: calc(100% - (1.6rem - 1px * 2) / 2);
  padding-top: calc((1.6rem - 1px * 2) / 2);
  padding-right: calc((1.6rem - 1px * 2) / 2);

  & > label {
    width: 100%;
    padding: 4px;
    box-sizing: border-box;
  }

  & > button {
    position: absolute;
    width: calc(1.6rem - 1px * 2);
    height: calc(1.6rem - 1px * 2);
    top: 0;
    right: 0;
    z-index: 1;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: white;
    border: 1px solid lightgray;
    border-radius: 50%;
    outline: none;
    cursor: pointer;

    font-size: 1.5rem;
  }
`;

const ImageInputContainerForNoImage = styled(ImageInputContainerAbstract)`
  width: 100%;
  height: 100%;

  & > label {
    width: 100%;
    padding: 4px 8px;
    box-sizing: border-box;
  }
`;
