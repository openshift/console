import * as React from 'react';
import { useFormikContext, FormikValues, useField } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import SourceSecretDropdown from '../../dropdown/SourceSecretDropdown';
import { getFieldId } from '../../formik-fields/field-utils';
import { sourceSecretModalLauncher } from './CreateSourceSecretModal';

const CREATE_SOURCE_SECRET = 'create-source-secret';

const SourceSecretSelector: React.FC = () => {
  const [secret] = useField('git.secret');
  const { values, setFieldValue } = useFormikContext<FormikValues>();

  const handleSave = (name: string) => {
    setFieldValue('git.secret', name);
  };

  const handleDropdownChange = (key: string) => {
    if (key === CREATE_SOURCE_SECRET) {
      setFieldValue('git.secret', secret.value);
      sourceSecretModalLauncher({ namespace: values.project.name, save: handleSave });
    } else {
      setFieldValue('git.secret', key);
    }
  };

  return (
    <React.Fragment>
      <FormGroup
        fieldId={getFieldId('source-secret', 'dropdown')}
        label="Source Secret"
        helperText="Secret with credentials for pulling your source code."
      >
        <SourceSecretDropdown
          dropDownClassName="dropdown--full-width"
          menuClassName="dropdown-menu--text-wrap"
          namespace={values.project.name}
          actionItem={{
            actionTitle: 'Create New Secret',
            actionKey: CREATE_SOURCE_SECRET,
          }}
          selectedKey={secret.value}
          title={secret.value}
          onChange={handleDropdownChange}
        />
      </FormGroup>
    </React.Fragment>
  );
};

export default SourceSecretSelector;
