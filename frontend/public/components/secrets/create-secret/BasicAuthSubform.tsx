import type { FC } from 'react';
import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormGroup,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { SecretStringData } from './types';

export const BasicAuthSubform: FC<BasicAuthSubformProps> = ({ onChange, stringData }) => {
  const { t } = useTranslation();

  const handleUsernameChange = (_event: FormEvent<HTMLInputElement>, value: string) => {
    onChange({ ...stringData, username: value });
  };

  const handlePasswordChange = (_event: FormEvent<HTMLInputElement>, value: string) => {
    onChange({ ...stringData, password: value });
  };

  return (
    <>
      <FormGroup label={t('public~Username')} fieldId="username">
        <TextInput
          id="username"
          data-test="secret-username"
          type="text"
          name="username"
          value={stringData.username || ''}
          onChange={handleUsernameChange}
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>{t('public~Optional username for Git authentication.')}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <FormGroup label={t('public~Password or token')} isRequired fieldId="password">
        <TextInput
          id="password"
          data-test="secret-password"
          type="password"
          name="password"
          value={stringData.password || ''}
          onChange={handlePasswordChange}
          isRequired
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              {t(
                'public~Password or token for Git authentication. Required if a ca.crt or .gitconfig file is not specified.',
              )}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </>
  );
};

type BasicAuthSubformProps = {
  onChange: (stringData: SecretStringData) => void;
  stringData: SecretStringData;
};
