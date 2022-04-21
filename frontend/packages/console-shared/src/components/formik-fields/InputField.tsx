import * as React from 'react';
import { TextInput, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import BaseInputField from './BaseInputField';
import { BaseInputFieldProps } from './field-types';

import './InputField.scss';

const InputField: React.FC<BaseInputFieldProps> = (
  { type = TextInputTypes.text, ...baseProps },
  ref,
) => (
  <BaseInputField type={type} {...baseProps}>
    {(props) => (
      <div className="oc-inputfield">
        <TextInput ref={ref} {...props} />
        {props.validated && props.validated !== ValidatedOptions.default ? (
          <div
            // pf-c-form-control is needed to load the right PatternFly variables.
            className={`pf-c-form-control oc-inputfield__validation-icon ${props.validated}`}
            // The BaseInputField will show an description (helper-text) below
            // the input field that describes the validation error.
            aria-hidden="true"
          />
        ) : null}
      </div>
    )}
  </BaseInputField>
);

export default React.forwardRef(InputField);
