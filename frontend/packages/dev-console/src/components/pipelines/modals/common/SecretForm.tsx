import * as React from 'react';
import * as _ from 'lodash';
import { FormikValues, useFormikContext } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import {
  SecretType,
  BasicAuthSubform,
  SSHAuthSubform,
  CreateConfigSubform,
} from '@console/internal/components/secrets/create-secret';
import { DropdownField, InputField, ActionGroupWithIcons } from '@console/shared';
import SecretAnnotation from './SecretAnnotation';
import './SecretForm.scss';

interface SecretFormProps {
  onSubmit: () => void;
  onClose: () => void;
}

const authTypes = {
  [SecretType.dockerconfigjson]: 'Image Registry Credentials',
  [SecretType.basicAuth]: 'Basic Authentication',
  [SecretType.sshAuth]: 'SSH Key',
};

const renderSecretForm = (
  type: SecretType,
  stringData: {
    [key: string]: any;
  },
  onDataChanged: (value: string) => void,
) => {
  switch (type) {
    case SecretType.basicAuth:
      return (
        <BasicAuthSubform onChange={onDataChanged} stringData={stringData[SecretType.basicAuth]} />
      );
    case SecretType.sshAuth:
      return (
        <SSHAuthSubform onChange={onDataChanged} stringData={stringData[SecretType.sshAuth]} />
      );
    case SecretType.dockerconfigjson:
      return (
        <CreateConfigSubform
          onChange={onDataChanged}
          stringData={stringData[SecretType.dockerconfigjson]}
        />
      );
    default:
      return null;
  }
};

const SecretForm: React.FC<SecretFormProps> = ({ onSubmit, onClose }) => {
  const {
    values: { secretForm },
    setFieldValue,
    errors,
  } = useFormikContext<FormikValues>();
  const [stringData, setStringData] = React.useState({
    [SecretType.basicAuth]: {},
    [SecretType.sshAuth]: {},
    [SecretType.dockerconfigjson]: {},
  });

  const onDataChanged = (value: string) => {
    const newStringData: typeof stringData = _.merge({}, stringData, { [secretForm.type]: value });
    setStringData(newStringData);
    if (secretForm.type === SecretType.dockerconfigjson) {
      setFieldValue(
        'secretForm.formData',
        _.mapValues({ '.dockerconfigjson': newStringData[secretForm.type] }, JSON.stringify),
      );
    } else {
      setFieldValue('secretForm.formData', newStringData[secretForm.type]);
    }
  };

  return (
    <div className="odc-secret-form">
      <h1 className="co-section-heading-tertiary odc-secret-form__title">Create Source Secret</h1>
      <div className="form-group">
        <InputField
          type={TextInputTypes.text}
          required
          name="secretForm.secretName"
          label="Secret Name"
          helpText="Unique name of the new secret."
        />
      </div>
      <div className="form-group">
        <SecretAnnotation fieldName="secretForm.annotations" />
      </div>
      <div className="form-group">
        <DropdownField
          name="secretForm.type"
          label="Authentication Type"
          items={authTypes}
          title={authTypes[secretForm.type]}
          fullWidth
          required
        />
      </div>
      {renderSecretForm(secretForm.type, stringData, onDataChanged)}
      <ActionGroupWithIcons
        onSubmit={onSubmit}
        onClose={onClose}
        isDisabled={!_.isEmpty(errors?.secretForm)}
      />
    </div>
  );
};

export default SecretForm;
