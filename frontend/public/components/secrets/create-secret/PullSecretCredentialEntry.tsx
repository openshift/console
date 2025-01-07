import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';

export const PullSecretCredentialEntry: React.FC<PullSecretCredentialEntryProps> = ({
  id,
  address,
  email,
  password,
  username,
  onChange,
}) => {
  const { t } = useTranslation();

  const updateEntry = React.useCallback(
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

  const handleBlurEvent = (e: React.SyntheticEvent<HTMLInputElement>) =>
    updateEntry(e.currentTarget.name, e.currentTarget.value.trim());

  const handleChangeEvent = (e: React.SyntheticEvent<HTMLInputElement>) =>
    updateEntry(e.currentTarget.name, e.currentTarget.value);

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
            onChange={handleChangeEvent}
            value={address}
            onBlur={handleBlurEvent}
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
            onChange={handleChangeEvent}
            value={username}
            onBlur={handleBlurEvent}
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
            onChange={handleChangeEvent}
            value={password}
            onBlur={handleBlurEvent}
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
            onChange={handleChangeEvent}
            value={email}
            onBlur={handleBlurEvent}
            data-test="image-secret-email"
          />
        </div>
      </div>
    </div>
  );
};

type PullSecretCredentialEntryProps = {
  id: number;
  address: string;
  email: string;
  password: string;
  username: string;
  onChange: (updatedEntry, entryIndex: number) => void;
};
