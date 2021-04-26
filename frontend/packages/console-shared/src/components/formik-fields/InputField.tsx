import * as React from 'react';
import { TextInput, TextInputTypes } from '@patternfly/react-core';
import { BaseInputFieldProps } from './field-types';
import BaseInputField from './BaseInputField';

const InputField: React.FC<BaseInputFieldProps> = (
  { type = TextInputTypes.text, ...baseProps },
  ref,
) => (
  <BaseInputField type={type} {...baseProps}>
    {(props) => <TextInput ref={ref} {...props} />}
  </BaseInputField>
);

export default React.forwardRef(InputField);
