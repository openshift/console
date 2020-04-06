/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { TextInput, TextInputTypes } from '@patternfly/react-core';
import { BaseInputFieldProps } from './field-types';
import BaseInputField from './BaseInputField';

const InputField: React.FC<BaseInputFieldProps> = ({
  type = TextInputTypes.text,
  ...baseProps
}) => (
  <BaseInputField type={type} {...baseProps}>
    {(props) => <TextInput {...props} />}
  </BaseInputField>
);

export default InputField;
