import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '../../utils';
import {
  getImageSecretKey,
  AUTHS_KEY,
  PullSecretCredentialsForm,
  UploadConfigSubform,
  SecretSubFormProps,
} from '.';

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

  const pullSecretData = React.useMemo<PullSecretData>(() => {
    try {
      const key = getImageSecretKey(secretType);
      const jsonContent = stringData[key] ?? '{}';
      return JSON.parse(jsonContent);
    } catch (err) {
      onError(`Error parsing secret's data: ${err.message}`);
      return {};
    }
  }, [stringData, secretType]);

  const onDataChanged = React.useCallback(
    (secretData: PullSecretData) => {
      if (!_.isError(secretData)) {
        onFormDisable(false);
      }
      const newDataKey = secretData[AUTHS_KEY] ? '.dockerconfigjson' : '.dockercfg';
      onChange({
        stringData: {
          [newDataKey]: JSON.stringify(secretData),
        },
        base64StringData: {},
      });
    },
    [onFormDisable, onchange],
  );

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
        <PullSecretCredentialsForm onChange={onDataChanged} stringData={pullSecretData} />
      ) : (
        <UploadConfigSubform
          onChange={onDataChanged}
          stringData={pullSecretData}
          onDisable={onFormDisable}
        />
      )}
    </>
  );
};

type DockerConfigData = {
  [url: string]: {
    username: string;
    password: string;
    email: string;
    auth: string;
  };
};

type DockerConfigJSONData = {
  auths: DockerConfigData;
};

export type PullSecretData = DockerConfigData | DockerConfigJSONData;
