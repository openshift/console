import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '../../utils';
import { SecretType, SecretSubFormProps, SecretStringData } from './types';
import { BasicAuthSubform } from './BasicAuthSubform';
import { SSHAuthSubform } from './SSHAuthSubform';

export const AuthSecretForm: React.FC<SecretSubFormProps> = ({
  onChange,
  stringData,
  isCreate,
  secretType,
}) => {
  const { t } = useTranslation();
  const [authType, setAuthType] = React.useState<SecretType>(secretType);
  const [data, setData] = React.useState<SecretStringData>(stringData);

  const authTypes = {
    [SecretType.basicAuth]: t('public~Basic authentication'),
    [SecretType.sshAuth]: t('public~SSH key'),
  };

  const handleDataChange = (secretsData: SecretStringData) => {
    setData(secretsData);
    onChange({ stringData: secretsData });
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
              onChange={(type: SecretType) => setAuthType(type)}
            />
          </div>
        </div>
      )}
      {authType === SecretType.basicAuth ? (
        <BasicAuthSubform onChange={handleDataChange} stringData={data} />
      ) : (
        <SSHAuthSubform onChange={handleDataChange} stringData={data} />
      )}
    </>
  );
};
