import * as _ from 'lodash';

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

export const makeSentence = (sentence: string, capitalize = true) => {
  const result = capitalize ? _.upperFirst(sentence) : sentence;
  return assureEndsWith(result, '.');
};

export const addMissingSubject = (sentence: string, subject: string) => {
  const c = sentence ? sentence.charAt(0) : '';
  if (c.toLowerCase() === c.toUpperCase() || c.toLowerCase() !== c) {
    // c is an upper case letter
    return sentence;
  }
  return subject ? `${_.upperFirst(subject)} ${sentence}` : sentence;
};
