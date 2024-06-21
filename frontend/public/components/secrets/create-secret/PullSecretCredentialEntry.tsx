import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { useEffect, useState } from 'react';

export const PullSecretCredentialEntry: React.FC<PullSecretCredentialEntryProps> = ({
  id,
  uid,
  entry,
  onChange,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<PullSecretCredentialEntryState>({
    address: entry?.address ?? '',
    username: entry?.username ?? '',
    password: entry?.password ?? '',
    email: entry?.email ?? '',
    auth: entry?.auth ?? '',
    uid: uid ?? '',
  });

  useEffect(() => {
    onChange(state, id);
  }, [state, id, onChange]);

  const handleChange = (field: keyof PullSecretCredentialEntryState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.currentTarget.value;
    setState((prevState) => {
      const newState = {
        ...prevState,
        [field]: value,
      };
      if (field === 'username' || field === 'password') {
        newState.auth = Base64.encode(`${newState.username}:${newState.password}`);
      }
      return newState;
    });
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    setState((prevState) => ({
      ...prevState,
      [name]: value.trim(),
    }));
  };

  return (
    <div className="co-m-pane__body-group" data-test-id="create-image-secret-form">
      <div className="form-group">
        <label className="control-label co-required" htmlFor={`${id}-address`}>
          {t('public~Registry server address')}
        </label>
        <div>
          <input
            className="pf-v5-c-form-control"
            id={`${id}-address`}
            aria-describedby={`${id}-address-help`}
            type="text"
            name="address"
            onChange={handleChange('address')}
            value={state.address}
            onBlur={handleBlur}
            data-test="image-secret-address"
            required
          />
        </div>
        <p className="help-block" id={`${id}-address-help`}>
          {t('public~For example quay.io or docker.io')}
        </p>
      </div>
      <div className="form-group">
        <label className="control-label co-required" htmlFor={`${id}-username`}>
          {t('public~Username')}
        </label>
        <div>
          <input
            className="pf-v5-c-form-control"
            id={`${id}-username`}
            type="text"
            name="username"
            onChange={handleChange('username')}
            value={state.username}
            onBlur={handleBlur}
            data-test="image-secret-username"
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label className="control-label co-required" htmlFor={`${id}-password`}>
          {t('public~Password')}
        </label>
        <div>
          <input
            className="pf-v5-c-form-control"
            id={`${id}-password`}
            type="password"
            name="password"
            onChange={handleChange('password')}
            value={state.password}
            onBlur={handleBlur}
            data-test="image-secret-password"
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label className="control-label" htmlFor={`${id}-email`}>
          {t('public~Email')}
        </label>
        <div>
          <input
            className="pf-v5-c-form-control"
            id={`${id}-email`}
            type="text"
            name="email"
            onChange={handleChange('email')}
            value={state.email}
            onBlur={handleBlur}
            data-test="image-secret-email"
          />
        </div>
      </div>
    </div>
  );
};

type CredentialEntry = {
  address?: string;
  username?: string;
  password?: string;
  email?: string;
  auth?: string;
};

type PullSecretCredentialEntryProps = {
  id: number;
  uid: string;
  entry: CredentialEntry;
  onChange: (state: PullSecretCredentialEntryState, id: number) => void;
};

type PullSecretCredentialEntryState = {
  address: string;
  username: string;
  password: string;
  email: string;
  auth: string;
  uid: string;
};
