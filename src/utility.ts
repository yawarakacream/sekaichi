export const range = (size: number) => [...Array(size).keys()];

export const removeLineBreaks = (str: string) => str.replace(/(\r\n|\n|\r)/gm, "");

export const isNaturalNumber = (n: number) => Number.isInteger(n) && 0 < n;

const padZero = (n: number, length: number) => n.toString().padStart(length, "0");

export const formatDate = (original: Date, mode: "html" | "filename" = "html") => {
  const year = original.getFullYear();
  const month = padZero(original.getMonth() + 1, 2);
  const date = padZero(original.getDate(), 2);
  const hours = padZero(original.getHours(), 2);
  const minutes = padZero(original.getMinutes(), 2);
  const seconds = padZero(original.getSeconds(), 2);
  switch (mode) {
    case "html":
      return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
    case "filename":
      return `${year}${month}${date}-${hours}${minutes}${seconds}`;
  }
};

export const shuffle = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
};

export type PartialSome<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
