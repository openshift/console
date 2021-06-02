import * as React from 'react';
import { TextArea } from '@patternfly/react-core';
import { prefixedID } from '../../../../../utils';
import { FormRow } from '../../../../form/form-row';

type CustomScriptProps = {
  id: string;
  isDisabled?: boolean;
  value: string;
  onChange: (value: string) => void;
};

const CloudInitCustomScript: React.FC<CustomScriptProps> = ({
  id,
  isDisabled,
  value,
  onChange,
}) => (
  <FormRow fieldId={prefixedID(id, 'custom-script')}>
    <TextArea
      id={prefixedID(id, 'custom-script')}
      disabled={isDisabled}
      value={value}
      onChange={onChange}
      className="kubevirt-create-vm-modal__cloud-init-custom-script-text-area"
    />
  </FormRow>
);

export default CloudInitCustomScript;
