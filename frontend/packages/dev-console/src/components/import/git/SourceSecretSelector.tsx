import * as React from 'react';
import { FormGroup, ControlLabel, HelpBlock } from 'patternfly-react';
import { useFormikContext, FormikValues, useField } from 'formik';
import SourceSecretDropdown from '../../dropdown/SourceSecretDropdown';
import { sourceSecretModalLauncher } from './CreateSourceSecretModal';

const CREATE_SOURCE_SECRET = 'create-source-secret';

interface SourceSecretSelectorProps {
  namespace: string;
  helpText: string;
}

const SourceSecretSelector: React.FC<SourceSecretSelectorProps> = ({ namespace, helpText }) => {
  const [secret] = useField('git.secret');
  const { setFieldValue } = useFormikContext<FormikValues>();

  const handleSave = (name: string) => {
    setFieldValue('git.secret', name);
  };

  const handleDropdownChange = (key: string) => {
    if (key === CREATE_SOURCE_SECRET) {
      setFieldValue('git.secret', secret.value);
      sourceSecretModalLauncher({ namespace, onSave: handleSave });
    } else {
      setFieldValue('git.secret', key);
    }
  };
  return (
    <React.Fragment>
      <FormGroup controlId="source-secret-selector-field">
        <ControlLabel>Source Secret</ControlLabel>
        <SourceSecretDropdown
          dropDownClassName="dropdown--full-width"
          menuClassName="dropdown-menu--text-wrap"
          namespace={namespace}
          actionItem={{
            actionTitle: 'Create New Secret',
            actionKey: CREATE_SOURCE_SECRET,
          }}
          selectedKey={secret.value}
          title={secret.value}
          onChange={handleDropdownChange}
        />
        <HelpBlock>{helpText}</HelpBlock>
      </FormGroup>
    </React.Fragment>
  );
};

export default SourceSecretSelector;
