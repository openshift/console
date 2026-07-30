export const assureEndsWith = (sentence: string, appendix: string) => {
  if (!sentence || !appendix || sentence.endsWith(appendix)) {
    return sentence;
  }

  return `${sentence}${appendix}`;
};
