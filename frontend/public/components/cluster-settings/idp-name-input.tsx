import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const IDPNameInput: React.FC<IDPNameInputProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="form-group" data-test="idp-name-form">
      <label className="co-required" htmlFor="idp-name">
        {t('public~Name')}
      </label>
      <span className="pf-v6-c-form-control">
        <input
          type="text"
          onChange={onChange}
          value={value}
          aria-describedby="idp-name-help"
          aria-label={t('public~Name')}
          id="idp-name"
          required
        />
      </span>
      <p className="help-block" id="idp-name-help">
        {t('public~Unique name of the new identity provider. This cannot be changed later.')}
      </p>
    </div>
  );
};

type IDPNameInputProps = {
  value: string;
  onChange: React.ReactEventHandler<HTMLInputElement>;
};
