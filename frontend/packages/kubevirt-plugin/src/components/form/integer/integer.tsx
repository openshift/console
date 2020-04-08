import * as React from 'react';
import * as classNames from 'classnames';
import { TextInput } from '@patternfly/react-core';
import { getSequence, setNativeValue } from '../../../utils/utils';
import {
  isMinus,
  KEY_CODES,
  INPUT_NAVIGATION_KEYS,
  INPUT_CTRL_COMBINATIONS_KEYS,
} from '../../../constants/keys';

import './integer.scss';

const NON_NEGATIVE_INTEGER_KEYS = [
  ...INPUT_NAVIGATION_KEYS,
  ...getSequence(KEY_CODES[0], KEY_CODES[9]),
  ...getSequence(KEY_CODES.NUMPAD[0], KEY_CODES.NUMPAD[9]),
];

const INTEGER_KEYS = [
  ...NON_NEGATIVE_INTEGER_KEYS,
  KEY_CODES.MINUS,
  KEY_CODES.HYPHEN_MINUS,
  KEY_CODES.NUMPAD.SUBTRACT,
];

const POSITIVE_INT_REGEX = /^[1-9]\d*$/;
const NON_NEGATIVE_INT_REGEX = /^(0|[1-9]\d*)$/;
const INT_REGEX = /^(-?0|-?[1-9]\d*)$/;

const PRECEEDING_ZEROS_POSITIVE_INT_REGEX = /^0*([1-9]\d*)$/;
const PRECEEDING_ZEROS_INT_REGEX = /^(-?)0*([1-9]\d*)$/;

const fixPrecedingZerosPositiveInt = (value) => {
  const match = PRECEEDING_ZEROS_POSITIVE_INT_REGEX.exec(value);
  return match && match.length === 2 ? match[1] : '';
};

const fixPrecedingZerosNonNegativeInt = (value) => {
  const match = PRECEEDING_ZEROS_POSITIVE_INT_REGEX.exec(value);
  return match && match.length === 2 ? match[1] : '0';
};

const fixInt = (value, oldValue, keyCode) => {
  if (value.length === 0 && isMinus(keyCode)) {
    if (oldValue) {
      return oldValue < 0 || oldValue === '-0' ? oldValue : `-${oldValue}`;
    }
    return '-0';
  }

  const match = PRECEEDING_ZEROS_INT_REGEX.exec(value);
  if (match && match.length === 3) {
    if (match[1]) {
      return `${match[1]}${match[2]}`;
    }
    return match[2];
  }
  return '0';
};

const isInputValid = (allowedKeys, keyCode, targetValue, additionalValidation) => {
  if (allowedKeys.includes(keyCode)) {
    return additionalValidation ? additionalValidation(keyCode, targetValue) : true;
  }
  return false;
};

const additionalPositiveValidation = (keyCode, targetValue) =>
  !(targetValue === '' && (keyCode === KEY_CODES[0] || keyCode === KEY_CODES.NUMPAD[0]));

export const Integer: React.FC<IntegerProps> = ({
  id,
  value,
  isDisabled,
  defaultValue,
  onChange,
  isPositive,
  isNonNegative,
  className,
  isFullWidth,
  isValid,
  ...restProps
}) => {
  let allowedKeys;
  let validRegex;
  let fixAfterValue;
  let min;
  let additionalValidation;

  if (isPositive) {
    allowedKeys = NON_NEGATIVE_INTEGER_KEYS;
    validRegex = POSITIVE_INT_REGEX;
    fixAfterValue = fixPrecedingZerosPositiveInt;
    min = 1;
    additionalValidation = additionalPositiveValidation;
  } else if (isNonNegative) {
    allowedKeys = NON_NEGATIVE_INTEGER_KEYS;
    validRegex = NON_NEGATIVE_INT_REGEX;
    fixAfterValue = fixPrecedingZerosNonNegativeInt;
    min = 0;
  } else {
    allowedKeys = INTEGER_KEYS;
    validRegex = INT_REGEX;
    fixAfterValue = fixInt;
  }

  const onKeydown = React.useCallback(
    (e) => {
      const { keyCode, target, ctrlKey, metaKey } = e;

      const ctrlDown = ctrlKey || metaKey; // Mac support

      // check for ctrl+c, a, v and x
      if (ctrlDown && INPUT_CTRL_COMBINATIONS_KEYS.includes(keyCode)) {
        return true;
      }

      if (!isInputValid(allowedKeys, keyCode, target.value, additionalValidation)) {
        e.preventDefault();
        return false;
      }

      const oldValue = target.value;

      window.setTimeout(() => {
        if (!validRegex.test(target.value)) {
          const v = fixAfterValue(target.value, oldValue, keyCode);
          setNativeValue(target, v);
          target.dispatchEvent(
            new Event('input', {
              bubbles: true,
              cancelable: true,
            }),
          );
        }
      }, 0);
      return true;
    },
    [additionalValidation, allowedKeys, fixAfterValue, validRegex],
  );

  return (
    <TextInput
      {...restProps}
      id={id}
      type="number"
      onKeyDown={onKeydown}
      min={min}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      className={classNames(className, {
        'kubevirt-integer-component': isFullWidth,
      })}
      isDisabled={isDisabled}
    />
  );
};

type IntegerProps = {
  id?: string;
  isFullWidth?: boolean;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event: React.FormEvent<HTMLInputElement>) => void;
  isPositive?: boolean;
  isNonNegative?: boolean; // is ignored when positive == true
  isDisabled?: boolean;
  isValid?: boolean;
  'aria-label'?: string;
};
