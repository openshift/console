import { joinGrammaticallyListOfItems, makeSentence } from '../grammar';
import {
  DNS1123_END_ERROR,
  DNS1123_START_END_ERROR,
  DNS1123_START_ERROR,
  DNS1123_TOO_LONG_ERROR,
  EMPTY_ERROR,
} from './strings';

const alphanumericRegex = '[a-zA-Z0-9]';

const DNS_1123_OFFENDING_CHARACTERS = {
  ',': 'comma',
  "'": 'apostrophe', // eslint-disable-line quotes
  _: 'underscore',
};

export enum ValidationErrorType {
  Error = 'error',
  TrivialError = 'trivial-error',
  Warn = 'warning',
  Info = 'info',
}

export const getValidationObject = (
  message: string,
  type: ValidationErrorType = ValidationErrorType.Error,
): ValidationObject => ({
  message,
  type,
});

export const getValidationErrorType = (validationObject: ValidationObject): ValidationErrorType => {
  return (
    validationObject && validationObject.type === ValidationErrorType.Error && validationObject.type
  );
};

export const getValidationErrorMessage = (validationObject: ValidationObject): string => {
  return (
    validationObject &&
    validationObject.type === ValidationErrorType.Error &&
    validationObject.message
  );
};

// DNS-1123 subdomain
export const validateDNS1123SubdomainValue = (value: string): ValidationObject => {
  if (!value) {
    return getValidationObject(makeSentence(EMPTY_ERROR, false), ValidationErrorType.TrivialError);
  }

  const forbiddenCharacters = new Set();
  const validationSentences = [];

  if (value.length > 253) {
    validationSentences.push(DNS1123_TOO_LONG_ERROR);
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

    if (!c.match('[-a-zA-Z0-9]')) {
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

  return result && getValidationObject(result, ValidationErrorType.Error);
};

export type ValidationObject = {
  message: string;
  type?: ValidationErrorType;
};
