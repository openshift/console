import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SecretChangeData, SecretStringData } from './types';

export const BasicAuthSubform: React.FC<BasicAuthSubformProps> = ({ onChange, stringData }) => {
  const { t } = useTranslation();

  const changeData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onChange({ ...stringData, [name]: value });
  };

  return (
    <>
      <div className="form-group">
        <label className="control-label" htmlFor="username">
          {t('public~Username')}
        </label>
        <div>
          <input
            className="pf-v5-c-form-control"
            id="username"
            data-test="secret-username"
            aria-describedby="username-help"
            type="text"
            name="username"
            onChange={changeData}
            value={stringData.username}
          />
          <p className="help-block" id="username-help">
            {t('public~Optional username for Git authentication.')}
          </p>
        </div>
      </div>
      <div className="form-group">
        <label className="control-label co-required" htmlFor="password">
          {t('public~Password or token')}
        </label>
        <div>
          <input
            className="pf-v5-c-form-control"
            id="password"
            data-test="secret-password"
            aria-describedby="password-help"
            type="password"
            name="password"
            onChange={changeData}
            value={stringData.password}
            required
          />
          <p className="help-block" id="password-help">
            {t(
              'public~Password or token for Git authentication. Required if a ca.crt or .gitconfig file is not specified.',
            )}
          </p>
        </div>
      </div>
    </>
  );
};

type BasicAuthSubformProps = {
  onChange: (stringData: SecretChangeData) => void;
  stringData: SecretStringData;
};
