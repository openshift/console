export const joinGrammaticallyListOfItems = (items: string[], separator = 'and') => {
  const result = items.join(', ');
  const lastCommaIdx = result.lastIndexOf(',');

  return items.length > 1 && lastCommaIdx >= 0
    ? `${result.substr(0, lastCommaIdx)} ${separator}${result.substr(lastCommaIdx + 1)}`
    : result;
};

export const assureEndsWith = (sentence: string, appendix: string) => {
  if (!sentence || !appendix || sentence.endsWith(appendix)) {
    return sentence;
  }

  return `${sentence}${appendix}`;
};
