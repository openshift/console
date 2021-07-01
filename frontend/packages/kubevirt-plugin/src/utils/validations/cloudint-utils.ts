import { get, isEmpty, set } from 'lodash';
import sshpk from 'sshpk';
import validator from 'validator';

export enum ValidationOption {
  success = 'success',
  error = 'error',
  warning = 'warning',
  default = 'default',
}

export type ValidationStatus = { [key: string]: { message: string; type: ValidationOption } };

const isValidSSHKey = (value: string): boolean => {
  try {
    const evaluatedKey = sshpk.parseKey(value, 'ssh');
    return evaluatedKey && true;
  } catch {
    return false;
  }
};

export const checkName = (
  obj: { [key: string]: string | string[] },
  errorCatcher: ErrorCatcher,
  t: Function,
) => {
  errorCatcher.removeError('name');
  if (obj?.name) {
    const isAsciiName = validator.isAscii(obj?.name);
    if (!isAsciiName) {
      errorCatcher.addError(t('kubevirt-plugin~Name can be only numbers and letters'), 'name');
    }
  }
};

export const checkHostname = (
  obj: { [key: string]: string | string[] },
  errorCatcher: ErrorCatcher,
  t: Function,
) => {
  errorCatcher.removeError('hostname');
  if (obj?.hostname) {
    const isAsciiHostname = validator.isAscii(obj?.hostname);
    if (!isAsciiHostname) {
      errorCatcher.addError(
        t('kubevirt-plugin~Hostname can be only numbers and letters'),
        'hostname',
      );
    }
  }
};

export const checkSSHKeys = (
  obj: { [key: string]: string | string[] },
  errorCatcher: ErrorCatcher,
  t: Function,
) => {
  ((obj?.ssh_authorized_keys as string[]) || []).map(
    (key: string, index: number) =>
      key && errorCatcher.removeError(['ssh_authorized_keys', index.toString()]),
  );
  if (obj?.ssh_authorized_keys) {
    const brokenSSHKeys =
      Array.isArray(obj?.ssh_authorized_keys) &&
      obj?.ssh_authorized_keys
        .map((value, index) => (!isEmpty(value) && !isValidSSHKey(value) ? index : null))
        .filter((key) => key !== null);

    if (!isEmpty(brokenSSHKeys)) {
      brokenSSHKeys.forEach((invalidKeyIndex) =>
        errorCatcher.addError(t('kubevirt-plugin~SSH Key is incorrect'), [
          'ssh_authorized_keys',
          invalidKeyIndex.toString(),
        ]),
      );
    }
  }
};

export const checkUser = (
  obj: { [key: string]: string | string[] },
  errorCatcher: ErrorCatcher,
  t: Function,
) => {
  errorCatcher.removeError('user');
  const isValidUsername = /^[a-z_]([a-z0-9_-]{0,31}|[a-z0-9_-]{0,30}\$)$/.test(obj?.user as string);
  if (!isValidUsername) {
    errorCatcher.addError(
      t('kubevirt-plugin~Username is required. must be a valid OS username'),
      'user',
    );
  }
};

export const checkPassword = (
  obj: { [key: string]: string | string[] },
  errorCatcher: ErrorCatcher,
  t: Function,
) => {
  errorCatcher.removeError('password');
  const isAsciiPassword = obj?.password && validator.isAscii(obj?.password);
  if (!isAsciiPassword && !isEmpty(obj?.password)) {
    errorCatcher.addError(
      t('kubevirt-plugin~Password can be only numbers and letters'),
      'password',
    );
  }
};

export class ErrorCatcher {
  errors: ValidationStatus = {};

  get isValid() {
    return !Object.values(this.errors)
      .reduce((acc, value) => {
        const recursiveFunction = (recursiveValue) => {
          if (recursiveValue?.type) {
            acc.push(recursiveValue);
            return;
          }
          if (Array.isArray(recursiveValue)) {
            recursiveValue.forEach((val) => recursiveFunction(val));
            return;
          }
          recursiveFunction(Object.values(recursiveValue));
        };
        value?.type ? acc.push(value) : recursiveFunction(value);
        return acc;
      }, [])
      .some((error) => error?.type === ValidationOption.error);
  }

  addError = (message: string, field: string | string[]) => {
    this.changeError(field, { message, type: ValidationOption.error });
  };

  removeError = (field: string | string[]) => {
    this.changeError(field, { message: '', type: ValidationOption.success });
  };

  changeError = (field: string | string[], value: { message: string; type: ValidationOption }) => {
    this.errors = set(this.errors, field, value);
  };

  getErrorMessage = (field: string) => get(this.errors, field)?.message;

  getErrorType = (field: string) => get(this.errors, field)?.type;

  getErrors = () => this.errors;
}
