import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '../../utils';
import { PullSecretCredentialsForm, PullSecretUploadForm, SecretSubFormProps } from '.';

export const PullSecretForm: React.FC<SecretSubFormProps> = ({
  onChange,
  onError,
  onFormDisable,
  stringData,
  secretType,
  isCreate,
}) => {
  const [authType, setAuthType] = React.useState('credentials');
  const { t } = useTranslation();
  const authTypes = {
    credentials: t('public~Image registry credentials'),
    'config-file': t('public~Upload configuration file'),
  };

  return (
    <>
      {isCreate && (
        <div className="form-group">
          <label className="control-label" htmlFor="secret-type">
            {t('public~Authentication type')}
          </label>
          <div className="co-create-secret__dropdown">
            <Dropdown
              items={authTypes}
              dropDownClassName="dropdown--full-width"
              id="dropdown-selectbox"
              selectedKey={authType}
              onChange={setAuthType}
            />
          </div>
        </div>
      )}
      {authType === 'credentials' ? (
        <PullSecretCredentialsForm
          onChange={onChange}
          onError={onError}
          onFormDisable={onFormDisable}
          secretType={secretType}
          stringData={stringData}
        />
      ) : (
        <PullSecretUploadForm
          onChange={onChange}
          stringData={stringData}
          secretType={secretType}
          onFormDisable={onFormDisable}
        />
      )}
    </>
  );
};

export type DockerConfigCredential = {
  username: string;
  password: string;
  email: string;
  auth: string;
};

export type DockerConfigData = {
  [url: string]: DockerConfigCredential;
};

type DockerConfigJSONData = {
  auths: DockerConfigData;
};

export type PullSecretData = DockerConfigData | DockerConfigJSONData;
