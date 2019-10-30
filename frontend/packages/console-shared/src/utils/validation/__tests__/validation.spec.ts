import { asValidationObject, validateDNS1123SubdomainValue } from '../validation';
import {
  DNS1123_END_ERROR,
  DNS1123_START_ERROR,
  DNS1123_TOO_LONG_ERROR,
  EMPTY_ERROR,
} from '../strings';

const validatesEmpty = (validateFunction, message = EMPTY_ERROR) => {
  expect(validateFunction('')).toEqual(asValidationObject(message));
  expect(validateFunction(null)).toEqual(asValidationObject(message));
  expect(validateFunction(undefined)).toEqual(asValidationObject(message));
};

describe('validation.js - validateDNS1123SubdomainValue tests', () => {
  it('returns undefined for valid value', () => {
    expect(validateDNS1123SubdomainValue('abc')).toEqual('nope');
    expect(validateDNS1123SubdomainValue('1abc')).toBeNull();
    expect(validateDNS1123SubdomainValue('aab-c')).toBeNull();
    expect(validateDNS1123SubdomainValue('a'.repeat(253))).toBeNull();
  });

  it('returns warning for uppercase value', () => {
    expect(validateDNS1123SubdomainValue('Aabc')).toEqual(
      asValidationObject('Uppercase characters are not allowed.'),
    );
  });

  it('returns message for too long value', () => {
    expect(validateDNS1123SubdomainValue('a'.repeat(254))).toEqual(
      asValidationObject(`${DNS1123_TOO_LONG_ERROR}.`),
    );
  });

  it('returns message for empty value', () => {
    validatesEmpty(validateDNS1123SubdomainValue, `${EMPTY_ERROR}.`);
  });

  it('returns message for value which starts with invalid char', () => {
    expect(validateDNS1123SubdomainValue('_abc')).toEqual(
      asValidationObject(
        'has to start with alphanumeric character. Underscore characters are not allowed.',
      ),
    );
    expect(validateDNS1123SubdomainValue('.abc')).toEqual(
      asValidationObject(
        "has to start with alphanumeric character. '.' characters are not allowed.",
      ),
    );
    expect(validateDNS1123SubdomainValue('-abc')).toEqual(
      asValidationObject(`${DNS1123_START_ERROR}.`),
    );
  });

  it('returns message for value which ends with invalid char', () => {
    expect(validateDNS1123SubdomainValue('abc_')).toEqual(
      asValidationObject(
        'has to end with alphanumeric character. Underscore characters are not allowed.',
      ),
    );
    expect(validateDNS1123SubdomainValue('abc.')).toEqual(
      asValidationObject("has to end with alphanumeric character. '.' characters are not allowed."),
    );
    expect(validateDNS1123SubdomainValue('abc-')).toEqual(
      asValidationObject(`${DNS1123_END_ERROR}.`),
    );
  });

  it('returns message for value which contains invalid char', () => {
    expect(validateDNS1123SubdomainValue('ab_c')).toEqual(
      asValidationObject('Underscore characters are not allowed.'),
    );
    expect(validateDNS1123SubdomainValue('ab/c')).toEqual(
      asValidationObject("'/' characters are not allowed."),
    );
    expect(validateDNS1123SubdomainValue('ab*c')).toEqual(
      asValidationObject("'*' characters are not allowed."),
    );
    expect(validateDNS1123SubdomainValue('ab.c')).toEqual(
      asValidationObject("'.' characters are not allowed."),
    );
  });
});
