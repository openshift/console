/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { InputGroup, TextInput, TextArea } from '@patternfly/react-core';
import { GroupInputProps, GroupTextType } from './field-types';
import BaseInputField from './BaseInputField';

const InputGroupField: React.FC<GroupInputProps> = (baseProps) => {
  return (
    <BaseInputField {...baseProps}>
      {({ beforeInput, afterInput, groupTextType, ...props }) => {
        return (
          <InputGroup>
            {beforeInput && beforeInput}
            {groupTextType === GroupTextType.TextArea ? (
              <TextArea {...props} />
            ) : (
              <TextInput {...props} />
            )}
            {afterInput && afterInput}
          </InputGroup>
        );
      }}
    </BaseInputField>
  );
};

export default InputGroupField;
