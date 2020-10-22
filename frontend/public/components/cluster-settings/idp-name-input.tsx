import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const IDPNameInput: React.FC<IDPNameInputProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <label className="control-label co-required" htmlFor="idp-name">
        {t('idp-name-input~Name')}
      </label>
      <input
        className="pf-c-form-control"
        type="text"
        onChange={onChange}
        value={value}
        aria-describedby="idp-name-help"
        id="idp-name"
        required
      />
      <p className="help-block" id="idp-name-help">
        {t(
          'idp-name-input~Unique name of the new identity provider. This cannot be changed later.',
        )}
      </p>
    </div>
  );
};

type IDPNameInputProps = {
  value: string;
  onChange: React.ReactEventHandler<HTMLInputElement>;
};
