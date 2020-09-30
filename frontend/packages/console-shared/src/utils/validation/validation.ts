import * as _ from 'lodash';
import { addMissingSubject, joinGrammaticallyListOfItems, makeSentence } from '../grammar';
import { ValidationErrorType, ValidationObject } from './types';
import {
  DNS1123_END_ERROR,
  DNS1123_START_END_ERROR,
  DNS1123_START_ERROR,
  EMPTY_ERROR,
  getStringTooLongErrorMsg,
  getStringTooShortErrorMsg,
} from './strings';

const alphanumericRegex = '[a-zA-Z0-9]';
const alphanumericRegexWithDash = '[-a-zA-Z0-9]';

const DNS1123_MAX_LENGTH = 253;

const DNS_1123_OFFENDING_CHARACTERS = {
  ',': 'comma',
  "'": 'apostrophe', // eslint-disable-line quotes
  _: 'underscore',
};

export const asValidationObject = (
  message: string,
  type: ValidationErrorType = ValidationErrorType.Error,
): ValidationObject => ({
  message,
  type,
});

export const validateEmptyValue = (
  value: string,
  { subject } = { subject: 'Value' },
): ValidationObject => {
  if (!value) {
    return asValidationObject(
      addMissingSubject(makeSentence(EMPTY_ERROR, false), subject),
      ValidationErrorType.TrivialError,
    );
  }
  return null;
};

// DNS-1123 subdomain
export const validateDNS1123SubdomainValue = (
  value: string,
  { subject, min, max }: { subject: string; min?: number; max?: number } = {
    subject: 'Name',
    min: undefined,
    max: DNS1123_MAX_LENGTH,
  },
): ValidationObject => {
  const maxLength = max || DNS1123_MAX_LENGTH;

  const emptyError = validateEmptyValue(value, { subject });
  if (emptyError) {
    return emptyError;
  }

  const forbiddenCharacters = new Set<string>();
  const validationSentences = [];

  if (min && value.length < min) {
    validationSentences.push(getStringTooShortErrorMsg(min));
  } else if (value.length > maxLength) {
    validationSentences.push(getStringTooLongErrorMsg(maxLength));
  }

  const startsWithAlphaNumeric = value.charAt(0).match(alphanumericRegex);
  const endsWithAlphaNumeric = value.charAt(value.length - 1).match(alphanumericRegex);

  if (!startsWithAlphaNumeric && !endsWithAlphaNumeric) {
    validationSentences.push(DNS1123_START_END_ERROR);
  } else if (!startsWithAlphaNumeric) {
    validationSentences.push(DNS1123_START_ERROR);
  } else if (!endsWithAlphaNumeric) {
    validationSentences.push(DNS1123_END_ERROR);
  }

  for (const c of value) {
    if (c.toLowerCase() !== c) {
      forbiddenCharacters.add('uppercase');
    }

    if (!c.match(alphanumericRegexWithDash)) {
      let offender;
      if (c.match('\\s')) {
        offender = 'whitespace';
      } else {
        offender = DNS_1123_OFFENDING_CHARACTERS[c] || `'${c}'`;
      }

      forbiddenCharacters.add(offender);
    }
  }

  let result = null;

  if (validationSentences.length > 0) {
    result = makeSentence(joinGrammaticallyListOfItems(validationSentences), false);
  }

  if (forbiddenCharacters.size > 0) {
    const forbiddenChars = joinGrammaticallyListOfItems(
      [...forbiddenCharacters].sort((a, b) => b.length - a.length),
    );
    const forbiddenCharsSentence = makeSentence(`${forbiddenChars} characters are not allowed`);
    result = result ? `${result} ${forbiddenCharsSentence}` : forbiddenCharsSentence;
  }

  return (
    result && asValidationObject(addMissingSubject(result, subject), ValidationErrorType.Error)
  );
};

export const alignWithDNS1123 = (str) => {
  if (!str) {
    return '';
  }

  const chars = str
    .toLowerCase()
    .replace(/\./g, '-')
    .split('');

  const firstValidCharIndex = chars.findIndex((c) => c.match(alphanumericRegex));
  const lastValidCharIndex = _.findLastIndex(chars, (c: string) => c.match(alphanumericRegex));

  if (firstValidCharIndex < 0) {
    return '';
  }

  let result = chars
    .slice(firstValidCharIndex, lastValidCharIndex + 1)
    .filter((c) => c.match(alphanumericRegexWithDash));

  if (result.length > DNS1123_MAX_LENGTH) {
    result = result.slice(0, DNS1123_MAX_LENGTH);
  }

  return result.join('');
};
