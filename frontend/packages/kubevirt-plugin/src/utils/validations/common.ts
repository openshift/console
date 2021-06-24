import * as _ from 'lodash';
import {
  asValidationObject,
  getName,
  getNamespace,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared';
import { parseURL } from '../url';

export const isValidationError = (validationObject: ValidationObject) =>
  !!validationObject && validationObject.type === ValidationErrorType.Error;

export const getValidationErrorMessage = (validationObject: ValidationObject): string => {
  return (
    validationObject &&
    validationObject.type === ValidationErrorType.Error &&
    validationObject.messageKey
  );
};

export const isPositiveNumber = (value) => value && value.toString().match(/^[1-9]\d*$/);

export const validateEntityAlreadyExists = (
  name,
  namespace,
  entities,
  { errorMessage } = { errorMessage: undefined },
): ValidationObject => {
  const exists =
    entities &&
    entities.some((entity) => getName(entity) === name && getNamespace(entity) === namespace);
  return exists ? asValidationObject(errorMessage) : null;
};

export const validateURL = (value: string): ValidationObject => {
  if (!value) {
    // t('kubevirt-plugin~URL cannot be empty')
    return asValidationObject(
      'kubevirt-plugin~URL cannot be empty',
      ValidationErrorType.TrivialError,
    );
  }
  if (_.trimStart(value).length !== value.length) {
    // t('kubevirt-plugin~URL cannot start with whitespace characters')
    return asValidationObject('kubevirt-plugin~URL cannot start with whitespace characters');
  }

  if (_.trimEnd(value).length !== value.length) {
    // t('kubevirt-plugin~URL cannot end with whitespace characters')
    return asValidationObject('kubevirt-plugin~URL cannot end with whitespace characters');
  }

  // t('kubevirt-plugin~URL has to be a valid URL')
  return parseURL(value) ? null : asValidationObject('kubevirt-plugin~URL has to be a valid URL');
};

export const validateContainer = (value: string): ValidationObject => {
  if (!value) {
    // t('kubevirt-plugin~Container cannot be empty')
    return asValidationObject(
      'kubevirt-plugin~Container cannot be empty',
      ValidationErrorType.TrivialError,
    );
  }
  if (_.trimStart(value).length !== value.length) {
    // t('kubevirt-plugin~Container cannot start with whitespace characters')
    return asValidationObject('kubevirt-plugin~Container cannot start with whitespace characters');
  }

  if (_.trimEnd(value).length !== value.length) {
    // t('kubevirt-plugin~Container cannot end with whitespace characters')
    return asValidationObject('kubevirt-plugin~Container cannot end with whitespace characters');
  }

  return null;
};

export enum ValidatedOptions {
  success = 'success',
  error = 'error',
  default = 'default',
}
