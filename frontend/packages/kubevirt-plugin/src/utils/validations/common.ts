import { getName, getNamespace } from '@console/shared';
import * as _ from 'lodash';
import { addMissingSubject, joinGrammaticallyListOfItems, makeSentence } from '../grammar';
import { parseUrl } from '../url';
import {
  DNS1123_END_ERROR,
  DNS1123_START_END_ERROR,
  DNS1123_START_ERROR,
  DNS1123_TOO_LONG_ERROR,
  EMPTY_ERROR,
  END_WHITESPACE_ERROR,
  START_WHITESPACE_ERROR,
  URL_INVALID_ERROR,
} from './strings';
import { ValidationErrorType, ValidationObject } from './types';

const alphanumericRegex = '[a-zA-Z0-9]';

const DNS_1123_OFFENDING_CHARACTERS = {
  ',': 'comma',
  "'": 'apostrophe', // eslint-disable-line quotes
  _: 'underscore',
};

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

export const isPositiveNumber = (value) => value && value.toString().match(/^[1-9]\d*$/);

export const validateEntityAlreadyExists = (
  name,
  namespace,
  entities,
  { errorMessage, subject } = { errorMessage: undefined, subject: undefined },
): ValidationObject => {
  const exists =
    entities &&
    entities.some((entity) => getName(entity) === name && getNamespace(entity) === namespace);
  return exists ? getValidationObject(addMissingSubject(errorMessage, subject)) : null;
};

export const validateEmptyValue = (
  value: string,
  { subject } = { subject: undefined },
): ValidationObject => {
  if (!value) {
    return getValidationObject(
      addMissingSubject(makeSentence(EMPTY_ERROR, false), subject),
      ValidationErrorType.TrivialError,
    );
  }
  return null;
};

// DNS-1123 subdomain
export const validateDNS1123SubdomainValue = (
  value: string,
  { subject } = { subject: undefined },
): ValidationObject => {
  const emptyError = validateEmptyValue(value, { subject });
  if (emptyError) {
    return emptyError;
  }

  const forbiddenCharacters = new Set<string>();
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

  return (
    result && getValidationObject(addMissingSubject(result, subject), ValidationErrorType.Error)
  );
};

export const validatePositiveInteger = (
  value: string,
  { subject } = { subject: undefined },
): ValidationObject => {
  const emptyError = validateEmptyValue(value, { subject });
  if (emptyError) {
    return emptyError;
  }
  return isPositiveNumber(value) ? null : getValidationObject('must be positive integer');
};

export const validateTrim = (
  value: string,
  { subject }: { subject: string } = { subject: undefined },
) => {
  const emptyError = validateEmptyValue(value, { subject });
  if (emptyError) {
    return emptyError;
  }

  let resultErrror;
  if (_.trimStart(value).length !== value.length) {
    resultErrror = START_WHITESPACE_ERROR;
  }

  if (_.trimEnd(value).length !== value.length) {
    resultErrror = END_WHITESPACE_ERROR;
  }

  return resultErrror
    ? getValidationObject(addMissingSubject(resultErrror, subject), ValidationErrorType.Error)
    : null;
};

export const validateURL = (
  value: string,
  { subject }: { subject: string } = { subject: undefined },
) => {
  const trimError = validateTrim(value, { subject });
  if (trimError) {
    return trimError;
  }

  return parseUrl(value)
    ? null
    : getValidationObject(addMissingSubject(URL_INVALID_ERROR, subject));
};
