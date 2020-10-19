import * as React from 'react';
import { FormGroup, Checkbox } from '@patternfly/react-core';

export const EncryptionFormGroup: React.FC<EncryptionFormGroupProps> = ({
  isChecked,
  onChange,
}) => (
  <FormGroup fieldId="configure-encryption" label="Encryption">
    <Checkbox
      id="configure-encryption"
      isChecked={isChecked}
      label="Enable Encryption"
      aria-label="Checkbox with description example"
      description="Data encryption for block and file storage. Object storage is always encrypted."
      onChange={onChange}
    />
  </FormGroup>
);

type EncryptionFormGroupProps = {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
};
