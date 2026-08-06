import type { FC } from 'react';
import { InputGroup, TextInput, TextArea, InputGroupItem } from '@patternfly/react-core';
import BaseInputField from './BaseInputField';
import type { GroupInputProps } from './field-types';
import { GroupTextType } from './field-types';

export const InputGroupField: FC<GroupInputProps> = ({
  beforeInput,
  afterInput,
  groupTextType,
  ...baseProps
}) => (
  <BaseInputField {...baseProps}>
    {(props) => (
      <InputGroup>
        <InputGroupItem>{beforeInput}</InputGroupItem>
        <InputGroupItem>
          {groupTextType === GroupTextType.TextArea ? (
            <TextArea {...props} />
          ) : (
            <TextInput {...props} />
          )}
        </InputGroupItem>
        {afterInput}
      </InputGroup>
    )}
  </BaseInputField>
);
