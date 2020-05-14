import * as React from 'react';
import * as _ from 'lodash';
import { FormikValues, useFormikContext } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { ButtonBar } from '@console/internal/components/utils';
import {
  SecretType,
  BasicAuthSubform,
  SSHAuthSubform,
  CreateConfigSubform,
} from '@console/internal/components/secrets/create-secret';
import { DropdownField, InputField, ActionGroupWithIcons } from '@console/shared';
import SecretAnnotation from './SecretAnnotation';
import './SecretForm.scss';

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

const SecretForm: React.FC<FormikValues> = ({
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
}) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const [stringData, setStringData] = React.useState({
    [SecretType.basicAuth]: {},
    [SecretType.sshAuth]: {},
    [SecretType.dockerconfigjson]: {},
  });

  const setValues = (type: SecretType) => {
    if (type === SecretType.dockerconfigjson) {
      setFieldValue(
        'formData',
        _.mapValues({ '.dockerconfigjson': stringData[type] }, JSON.stringify),
      );
    } else {
      setFieldValue('formData', stringData[type]);
    }
  };

  const onDataChanged = (value: string) => {
    setStringData(_.merge(stringData, { [values.type]: value }));
    setValues(values.type);
  };

  return (
    <div className="odc-secret-form">
      <h1 className="co-section-heading-tertiary odc-secret-form__title">Create Source Secret</h1>
      <div className="form-group">
        <InputField
          type={TextInputTypes.text}
          required
          name="secretName"
          label="Secret Name"
          helpText="Unique name of the new secret."
        />
      </div>
      <div className="form-group">
        <SecretAnnotation fieldName="annotations" />
      </div>
      <div className="form-group">
        <DropdownField
          name="type"
          label="Authentication Type"
          items={authTypes}
          title={authTypes[values.type]}
          onChange={(type: SecretType) => setValues(type)}
          fullWidth
          required
        />
      </div>
      {renderSecretForm(values.type, stringData, onDataChanged)}
      <ButtonBar errorMessage={status?.submitError} inProgress={isSubmitting}>
        <ActionGroupWithIcons onSubmit={handleSubmit} onClose={handleReset} />
      </ButtonBar>
    </div>
  );
};

export default SecretForm;
