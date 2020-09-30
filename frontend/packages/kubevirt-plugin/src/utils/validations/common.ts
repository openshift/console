import * as _ from 'lodash';
import {
  addMissingSubject,
  getName,
  getNamespace,
  asValidationObject,
  validateEmptyValue,
  ValidationErrorType,
  ValidationObject,
  joinGrammaticallyListOfItems,
} from '@console/shared';
import { parseURL } from '../url';
import { END_WHITESPACE_ERROR, START_WHITESPACE_ERROR, URL_INVALID_ERROR } from './strings';
import { DiskBus } from '../../constants/vm/storage/disk-bus';
import { UIValidationType, UIValidation } from '../../types/ui/ui';

export const isValidationError = (validationObject: ValidationObject) =>
  !!validationObject && validationObject.type === ValidationErrorType.Error;

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
  return exists ? asValidationObject(addMissingSubject(errorMessage, subject)) : null;
};

export const validatePositiveInteger = (
  value: string,
  { subject } = { subject: undefined },
): ValidationObject => {
  const emptyError = validateEmptyValue(value, { subject });
  if (emptyError) {
    return emptyError;
  }
  return isPositiveNumber(value) ? null : asValidationObject('must be positive integer');
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
    ? asValidationObject(addMissingSubject(resultErrror, subject), ValidationErrorType.Error)
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

  return parseURL(value) ? null : asValidationObject(addMissingSubject(URL_INVALID_ERROR, subject));
};

export const validateBus = (value: DiskBus, allowedBuses: Set<DiskBus>): ValidationObject => {
  if (allowedBuses && !allowedBuses.has(value)) {
    return asValidationObject(
      `Invalid interface type. Valid types are: ${joinGrammaticallyListOfItems(
        [...allowedBuses].map((b) => b.toString()),
      )}`,
      ValidationErrorType.Error,
    );
  }
  return null;
};

export const getValidationByType = (
  validationList: UIValidation[],
  type: UIValidationType,
): UIValidation => validationList?.find((val) => val.type === type);
