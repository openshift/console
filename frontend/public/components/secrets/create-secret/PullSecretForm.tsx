import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '../../utils';
import {
  SecretType,
  getImageSecretKey,
  AUTHS_KEY,
  CreateConfigSubform,
  UploadConfigSubform,
} from '.';
import { useCallback, useState } from 'react';

export const PullSecretForm: React.FC<PullSecretFormProps> = ({
  onChange,
  onError,
  onFormDisable,
  stringData,
  secretType,
  isCreate,
}) => {
  const [authType, setAuthType] = useState<string>('credentials');
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

  const onDataChanged = useCallback(
    (secretData: PullSecretData) => {
      if (!_.isError(secretData)) {
        onFormDisable(false);
      }
      const newDataKey = secretData[AUTHS_KEY] ? '.dockerconfigjson' : '.dockercfg';
      onChange({
        stringData: { [newDataKey]: JSON.stringify(secretData) },
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
        <CreateConfigSubform
          onChange={onDataChanged}
          stringData={pullSecretData} /*pullSecretData*/
        />
      ) : (
        <UploadConfigSubform
          onChange={onDataChanged}
          stringData={pullSecretData} // pullSecretData
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

type PullSecretData = DockerConfigData | DockerConfigJSONData;

type PullSecretFormProps = {
  onChange: (data: any) => void;
  onError: (message: string) => void;
  onFormDisable: (disable: boolean) => void;
  stringData: { [key: string]: string };
  secretType: SecretType;
  isCreate: boolean;
};
