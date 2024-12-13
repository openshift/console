import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SecretSubFormProps } from './types';

export const WebHookSecretForm: React.FC<SecretSubFormProps> = ({ onChange, stringData }) => {
  const { t } = useTranslation();

  const handleWebHookSecretChange = (newSecret: string) => {
    onChange({ stringData: { ...stringData, WebHookSecretKey: newSecret }, base64StringData: {} });
  };

  const changeWebHookSecretkey = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSecret = event.target.value;
    handleWebHookSecretChange(newSecret);
  };

  const generateWebHookSecret = () => {
    const newSecret = window.crypto.randomUUID();
    handleWebHookSecretChange(newSecret);
  };

  return (
    <div className="form-group">
      <label className="control-label co-required" htmlFor="webhook-secret-key">
        {t('public~Webhook secret key')}
      </label>
      <div className="pf-v6-c-input-group">
        <input
          className="pf-v6-c-form-control"
          id="webhook-secret-key"
          data-test="secret-key"
          type="text"
          name="webhookSecretKey"
          onChange={changeWebHookSecretkey}
          value={stringData.WebHookSecretKey}
          aria-describedby="webhook-secret-help"
          required
        />
        <button
          type="button"
          onClick={generateWebHookSecret}
          className="pf-v6-c-button pf-m-tertiary"
          data-test="webhook-generate-button"
        >
          {t('public~Generate')}
        </button>
      </div>
      <p className="help-block" id="webhook-secret-help">
        {t('public~Value of the secret will be supplied when invoking the webhook.')}
      </p>
    </div>
  );
};
