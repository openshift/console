import * as React from 'react';
import { TFunction } from 'i18next';

import {
  InputGroup,
  FormGroup,
  TextInput,
  Button,
  ValidatedOptions,
  Tooltip,
} from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { VaultConfig } from '../../types';

export const VaultTokenConfigure: React.FC<VaultAuthMethodProps> = ({
  t,
  className,
  vaultState,
  setAuthValue,
  isValid,
  isScEncryption,
}) => {
  const [revealToken, setRevealToken] = React.useState(false);

  return (
    <FormGroup
      fieldId="vault-token"
      label={t('ceph-storage-plugin~Token')}
      className={className}
      helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
      validated={isValid(vaultState.authValue?.valid)}
      helperText={
        isScEncryption &&
        t(
          'ceph-storage-plugin~Create a secret with the token for every namespace using encrypted PVCs.',
        )
      }
      isRequired
    >
      <InputGroup className="ocs-install-kms__form-token">
        <TextInput
          value={vaultState.authValue?.value}
          onChange={setAuthValue}
          type={revealToken ? 'text' : 'password'}
          id="vault-token"
          name="vault-token"
          isRequired
          validated={isValid(vaultState.authValue?.valid)}
        />
        <Tooltip
          content={
            revealToken
              ? t('ceph-storage-plugin~Hide token')
              : t('ceph-storage-plugin~Reveal token')
          }
        >
          <Button variant="control" onClick={() => setRevealToken(!revealToken)}>
            {revealToken ? <EyeSlashIcon /> : <EyeIcon />}
          </Button>
        </Tooltip>
      </InputGroup>
    </FormGroup>
  );
};

export const VaultServiceAccountConfigure: React.FC<VaultAuthMethodProps> = ({
  t,
  className,
  vaultState,
  setAuthValue,
  isValid,
}) => {
  return (
    <FormGroup
      fieldId="vault-sa-role"
      label={t('ceph-storage-plugin~Role')}
      className={className}
      helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
      validated={isValid(vaultState.authValue?.valid)}
      isRequired
    >
      <TextInput
        value={vaultState.authValue?.value}
        onChange={setAuthValue}
        type="text"
        id="vault-sa-role"
        name="vault-sa-role"
        isRequired
        validated={isValid(vaultState.authValue?.valid)}
      />
    </FormGroup>
  );
};

export type VaultAuthMethodProps = {
  isScEncryption?: boolean;
  className: string;
  vaultState: VaultConfig;
  t: TFunction;
  setAuthValue: (string) => void;
  isValid: (boolean) => ValidatedOptions.error | ValidatedOptions.default;
};
