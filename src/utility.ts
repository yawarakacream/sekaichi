export const range = (size: number) => [...Array(size).keys()];

export const removeLineBreaks = (str: string) => str.replace(/(\r\n|\n|\r)/gm, "");

export const isNaturalNumber = (n: number) => Number.isInteger(n) && 0 < n;

const padZero = (n: number, length: number) => n.toString().padStart(length, "0");

export const formatDate = (original: Date) => {
  const year = original.getFullYear();
  const month = padZero(original.getMonth() + 1, 2);
  const date = padZero(original.getDate(), 2);
  const hours = padZero(original.getHours(), 2);
  const minutes = padZero(original.getMinutes(), 2);
  return `${year}/${month}/${date} ${hours}:${minutes}`;
};

export type PartialSome<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
