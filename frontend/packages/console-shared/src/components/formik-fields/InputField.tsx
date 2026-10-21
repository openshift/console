import { forwardRef } from 'react';
import { TextInput, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import BaseInputField from './BaseInputField';
import type { BaseInputFieldProps } from './field-types';

import './InputField.scss';

const InputField = forwardRef<HTMLInputElement, BaseInputFieldProps>(
  ({ type = TextInputTypes.text, ...baseProps }, ref) => (
    <BaseInputField type={type} {...baseProps}>
      {(props) => (
        <div className="oc-inputfield">
          <TextInput ref={ref} {...props} />
          <div
            className={`oc-inputfield__validation-icon ${props.validated}`}
            aria-hidden="true"
            hidden={!props.validated || props.validated === ValidatedOptions.default}
          />
        </div>
      )}
    </BaseInputField>
  ),
);

export default InputField;
