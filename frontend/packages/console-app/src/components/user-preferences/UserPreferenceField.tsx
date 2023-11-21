import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk';
import { componentForFieldType } from './const';
import { ResolvedUserPreferenceItem } from './types';

type UserPreferenceFieldProps = { item: ResolvedUserPreferenceItem };

const UserPreferenceField: React.FC<UserPreferenceFieldProps> = ({ item }) => {
  const { id, label, field, description } = item;

  const FieldComponent: React.FC<React.ComponentProps<
    typeof componentForFieldType[UserPreferenceFieldType]
  >> = componentForFieldType[field.type];

  return (
    <FormGroup key={id} fieldId={id} label={label} data-test={`${id} field`}>
      {FieldComponent ? <FieldComponent id={id} {...field} /> : null}

      <FormHelperText>
        <HelperText>
          <HelperTextItem>{description}</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default UserPreferenceField;
