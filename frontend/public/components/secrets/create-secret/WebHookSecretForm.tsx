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
    // the current (4.5.5) version of typescript does not have the randomUUID function defined, thus it produces ts errors
    // but all of our supported browsers should have it defined, so we can safely ignore the error.
    // randomUUID is firstly defined in 4.6 version of typescript, so once we upgrade to this or newer version we can remove this ts-ignore
    // @ts-ignore-next-line
    const newSecret = window.crypto.randomUUID();
    handleWebHookSecretChange(newSecret);
  };

  return (
    <div className="form-group">
      <label className="control-label co-required" htmlFor="webhook-secret-key">
        {t('public~Webhook secret key')}
      </label>
      <div className="pf-v5-c-input-group">
        <input
          className="pf-v5-c-form-control"
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
          className="pf-v5-c-button pf-m-tertiary"
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
