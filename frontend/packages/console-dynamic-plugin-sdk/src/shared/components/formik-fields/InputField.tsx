import * as React from 'react';
import { TextInput, TextInputTypes } from '@patternfly/react-core';
import BaseInputField from './BaseInputField';
import { BaseInputFieldProps } from './field-types';

const InputField: React.FC<BaseInputFieldProps> = (
  { type = TextInputTypes.text, ...baseProps },
  ref,
) => (
  <BaseInputField type={type} {...baseProps}>
    {(props) => <TextInput ref={ref} {...props} />}
  </BaseInputField>
);

export default React.forwardRef(InputField);
