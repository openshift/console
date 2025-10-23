import { FCC, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormGroup,
  TextInput,
  Button,
  InputGroup,
  InputGroupItem,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { SecretSubFormProps } from './types';

export const WebHookSecretForm: FCC<SecretSubFormProps> = ({ onChange, stringData }) => {
  const { t } = useTranslation();

  const handleWebHookSecretChange = (newSecret: string) => {
    onChange({ stringData: { ...stringData, WebHookSecretKey: newSecret }, base64StringData: {} });
  };

  const changeWebHookSecretkey = (_event: FormEvent<HTMLInputElement>, value: string) => {
    handleWebHookSecretChange(value);
  };

  const generateWebHookSecret = () => {
    const newSecret = window.crypto.randomUUID();
    handleWebHookSecretChange(newSecret);
  };

  return (
    <FormGroup label={t('public~Webhook secret key')} isRequired fieldId="webhook-secret-key">
      <InputGroup>
        <InputGroupItem isFill>
          <TextInput
            id="webhook-secret-key"
            data-test="secret-key"
            type="text"
            name="webhookSecretKey"
            onChange={changeWebHookSecretkey}
            value={stringData.WebHookSecretKey || ''}
            isRequired
          />
        </InputGroupItem>
        <InputGroupItem>
          <Button
            variant="tertiary"
            onClick={generateWebHookSecret}
            data-test="webhook-generate-button"
          >
            {t('public~Generate')}
          </Button>
        </InputGroupItem>
      </InputGroup>
      <FormHelperText>
        <HelperText>
          <HelperTextItem>
            {t('public~Value of the secret will be supplied when invoking the webhook.')}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};
