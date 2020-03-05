// https://github.com/lodash/lodash/issues/89#issuecomment-427249903
export const arrayInsert = <T>(index: number, arr: T[], ...ins: T[]) => [
  ...arr.slice(0, index),
  ...ins,
  ...arr.slice(index),
];
