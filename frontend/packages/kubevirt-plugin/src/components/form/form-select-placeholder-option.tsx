import * as React from 'react';
import { FormSelectOption } from '@patternfly/react-core';

export const asFormSelectValue = (value) => value || '';

// renders only when props change (shallow compare)
export const FormSelectPlaceholderOption: React.FC<FormSelectPlaceholderOptionProps> = ({
  placeholder,
  isDisabled,
}) => {
  return (
    placeholder && (
      <FormSelectOption isDisabled={isDisabled} key="defaultValue" value="" label={placeholder} />
    )
  );
};

type FormSelectPlaceholderOptionProps = {
  placeholder?: string;
  isDisabled?: boolean;
};
