import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '../../utils';
import { SecretType, BasicAuthSubform, SSHAuthSubform, SecretSubFormProps } from '.';

export const SourceSecretForm: React.FC<SecretSubFormProps> = ({
  onChange,
  stringData,
  isCreate,
}) => {
  const { t } = useTranslation();
  const [authType, setAuthType] = React.useState<SecretType>(SecretType.basicAuth);

  const authTypes = {
    [SecretType.basicAuth]: t('public~Basic authentication'),
    [SecretType.sshAuth]: t('public~SSH key'),
  };

  return (
    <>
      {isCreate ? (
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
      ) : null}
      {authType === SecretType.basicAuth ? (
        <BasicAuthSubform onChange={onChange} stringData={stringData} />
      ) : (
        <SSHAuthSubform onChange={onChange} stringData={stringData} />
      )}
    </>
  );
};
