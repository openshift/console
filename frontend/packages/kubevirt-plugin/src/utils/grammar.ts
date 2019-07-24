import * as _ from 'lodash';

export const joinGrammaticallyListOfItems = (items: string[]) => {
  const result = items.join(', ');
  const lastCommaIdx = result.lastIndexOf(',');

  return items.length > 1 && lastCommaIdx >= 0
    ? `${result.substr(0, lastCommaIdx)} and${result.substr(lastCommaIdx + 1)}`
    : result;
};

export const makeSentence = (sentence: string, capitalize = true) => {
  const result = capitalize ? _.capitalize(sentence) : sentence;
  return !result || result.charAt(result.length) === '.' ? result : `${result}.`;
};

export const addMissingSubject = (sentence: string, subject: string) => {
  const c = sentence ? sentence.charAt(0) : '';
  return c.toLowerCase() !== c ? sentence : `${_.capitalize(subject)} ${sentence}`;
};
