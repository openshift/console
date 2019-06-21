/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { FormGroup, ControlLabel } from 'patternfly-react';
import { useFormikContext, FormikValues, useField } from 'formik';
import { createModalLauncher } from '../../../../../../public/components/factory/modal';
import SourceSecretDropdown from '../../dropdown/SourceSecretDropdown';
import {
  withSecretForm,
  SourceSecretForm,
  SecretTypeAbstraction,
} from '../../../../../../public/components/secrets/create-secret';

const CREATE_SOURCE_SECRET = 'create-source-secret';

interface SourceSecretSelectorProps {
  namespace: string;
}

interface CreateSourceSecretModalProps {
  cancel: (e: Event) => void;
  close: () => void;
  onSave?: (name: string) => void;
  onCancel: () => void;
  namespace: string;
}

const CreateSourceSecretModal: React.FC<CreateSourceSecretModalProps> = ({
  close,
  namespace,
  onSave,
  onCancel,
}) => {
  const CreateSourceSecretForm = withSecretForm(SourceSecretForm, true);
  const onClose = () => {
    close();
    onCancel();
    return null;
  };

  return (
    <CreateSourceSecretForm
      onCancel={onClose}
      onSave={onSave}
      fixed={{ metadata: { namespace } }}
      secretTypeAbstraction={SecretTypeAbstraction.source}
      explanation="Source secrets let you authenticate against a Git server."
      titleVerb="Create"
      isCreate
    />
  );
};

const sourceSecretModalLauncher = createModalLauncher<CreateSourceSecretModalProps>(
  CreateSourceSecretModal,
);

const SourceSecretSelector: React.FC<SourceSecretSelectorProps> = ({ namespace }) => {
  const [selectedKey] = useField('git.secret.selectedKey');
  const { setFieldValue } = useFormikContext<FormikValues>();
  let secretName: string;

  const onSave = (name: string) => {
    secretName = name;
  };

  const onCancel = () => {
    secretName = '';
  };

  const onDropdownChange = async (key: string) => {
    if (key === CREATE_SOURCE_SECRET) {
      setFieldValue('git.secret.isNewSecret', false);
      setFieldValue('git.secret.selectedKey', key);
      await sourceSecretModalLauncher({ namespace, onSave, onCancel }).result.then(() => {
        setFieldValue('git.secret.selectedKey', secretName);
        if (secretName) {
          setFieldValue('git.secret.isNewSecret', true);
        }
      });
    } else {
      setFieldValue('git.secret.selectedKey', key);
      setFieldValue('git.secret.isNewSecret', false);
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
          selectedKey={selectedKey.value}
          title={
            selectedKey.value === 'create-source-secret' ? 'Create New Secret' : selectedKey.value
          }
          onChange={onDropdownChange}
        />
      </FormGroup>
    </React.Fragment>
  );
};

export default SourceSecretSelector;
