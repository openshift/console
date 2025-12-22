import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import {
  FormGroup,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Button,
  FormFieldGroup,
  ActionGroup,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';

export const PullSecretCredentialEntry: React.FCC<PullSecretCredentialEntryProps> = ({
  id,
  address,
  email,
  password,
  username,
  onChange,
  removeEntry,
  showRemoveButton,
}) => {
  const { t } = useTranslation();

  const updateEntry = useCallback(
    (name: string, value: string): void => {
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      const auth =
        username && password ? Base64.encode(`${trimmedUsername}:${trimmedPassword}`) : '';
      onChange(
        {
          address,
          username,
          password,
          email,
          [name]: value,
          ...(auth ? { auth } : {}),
        },
        id,
      );
    },
    [address, email, id, onChange, password, username],
  );

  return (
    <FormFieldGroup data-test-id="create-image-secret-form" className="pf-v6-u-display-block">
      {showRemoveButton && (
        <ActionGroup className="pf-v6-u-m-0 pf-v6-u-ml-auto">
          <Button
            onClick={() => removeEntry(id)}
            type="button"
            variant="link"
            data-test="remove-entry-button"
            icon={<MinusCircleIcon />}
          >
            {t('public~Remove credentials')}
          </Button>
        </ActionGroup>
      )}
      <FormGroup label={t('public~Registry server address')} isRequired fieldId={`${id}-address`}>
        <TextInput
          id={`${id}-address`}
          type="text"
          name="address"
          value={address}
          onChange={(_event, value) => updateEntry('address', value)}
          onBlur={(event) => updateEntry('address', event.currentTarget.value.trim())}
          data-test="image-secret-address"
          isRequired
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>{t('public~For example quay.io or docker.io')}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <FormGroup label={t('public~Username')} isRequired fieldId={`${id}-username`}>
        <TextInput
          id={`${id}-username`}
          type="text"
          name="username"
          value={username}
          onChange={(_event, value) => updateEntry('username', value)}
          onBlur={(event) => updateEntry('username', event.currentTarget.value.trim())}
          data-test="image-secret-username"
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('public~Password')} isRequired fieldId={`${id}-password`}>
        <TextInput
          id={`${id}-password`}
          type="password"
          name="password"
          value={password}
          onChange={(event, value) => updateEntry('password', value)}
          onBlur={(event) => updateEntry('password', event.currentTarget.value.trim())}
          data-test="image-secret-password"
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('public~Email')} fieldId={`${id}-email`}>
        <TextInput
          id={`${id}-email`}
          type="email"
          name="email"
          value={email}
          onChange={(_event, value) => updateEntry('email', value)}
          onBlur={(event) => updateEntry('email', event.currentTarget.value.trim())}
          data-test="image-secret-email"
        />
      </FormGroup>
    </FormFieldGroup>
  );
};

type PullSecretCredentialEntryProps = {
  id: number;
  address: string;
  email: string;
  password: string;
  username: string;
  onChange: (updatedEntry, entryIndex: number) => void;
  removeEntry: (entryIndex: number) => void;
  showRemoveButton: boolean;
};
