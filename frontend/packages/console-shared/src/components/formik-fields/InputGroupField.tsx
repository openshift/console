import * as React from 'react';
import { InputGroup, TextInput, TextArea, InputGroupItem } from '@patternfly/react-core';
import BaseInputField from './BaseInputField';
import { GroupInputProps, GroupTextType } from './field-types';

const InputGroupField: React.FC<GroupInputProps> = ({
  beforeInput,
  afterInput,
  groupTextType,
  ...baseProps
}) => {
  return (
    <BaseInputField {...baseProps}>
      {(props) => {
        return (
          <InputGroup>
            <InputGroupItem>{beforeInput}</InputGroupItem>
            <InputGroupItem>
              {groupTextType === GroupTextType.TextArea ? (
                <TextArea {...props} />
              ) : (
                <TextInput {...props} />
              )}
            </InputGroupItem>
            <InputGroupItem>{afterInput}</InputGroupItem>
          </InputGroup>
        );
      }}
    </BaseInputField>
  );
};

export default InputGroupField;
