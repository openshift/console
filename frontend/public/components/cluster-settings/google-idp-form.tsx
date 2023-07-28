import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { ButtonBar, history, PageHeading } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';

export const AddGooglePage = () => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('google');
  const [clientID, setClientID] = React.useState('');
  const [clientSecret, setClientSecret] = React.useState('');
  const [hostedDomain, setHostedDomain] = React.useState('');

  const { t } = useTranslation();

  const thenPromise = (res) => {
    setInProgress(false);
    setErrorMessage('');
    return res;
  };

  const catchError = (error) => {
    const err = error.message || t('public~An error occurred. Please try again.');
    setInProgress(false);
    setErrorMessage(err);
    return Promise.reject(err);
  };

  const handlePromise = (promise) => {
    setInProgress(true);

    return promise.then(
      (res) => thenPromise(res),
      (error) => catchError(error),
    );
  };

  const getOAuthResource = () => {
    return handlePromise(getOAuth());
  };

  const createClientSecret = () => {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'google-client-secret-',
        namespace: 'openshift-config',
      },
      stringData: {
        clientSecret,
      },
    };

    return handlePromise(k8sCreate(SecretModel, secret));
  };

  const addGoogleIDP = (oauth: OAuthKind, clientSecretName: string, dryRun?: boolean) => {
    const idp: IdentityProvider = {
      name,
      type: 'Google',
      mappingMethod: 'claim',
      google: {
        hostedDomain,
        clientID,
        clientSecret: {
          name: clientSecretName,
        },
      },
    };

    return handlePromise(addIDP(oauth, idp, dryRun));
  };

  const submit = (e) => {
    e.preventDefault();

    // Clear any previous errors.
    setErrorMessage('');
    getOAuthResource().then((oauth: OAuthKind) => {
      addGoogleIDP(oauth, mockNames.secret, true)
        .then(() => {
          return createClientSecret()
            .then((secret: K8sResourceKind) => addGoogleIDP(oauth, secret.metadata.name))
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: Google');

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        helpText={t(
          'public~You can use Google integration for users authenticating with Google credentials.',
        )}
      />
      <div className="co-m-pane__body">
        <form onSubmit={submit} name="form" className="co-m-pane__body-group">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-id">
              {t('public~Client ID')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={(e) => setClientID(e.currentTarget.value)}
              value={clientID}
              id="client-id"
              required
            />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-secret">
              {t('public~Client secret')}
            </label>
            <input
              className="pf-c-form-control"
              type="password"
              onChange={(e) => setClientSecret(e.currentTarget.value)}
              value={clientSecret}
              id="client-secret"
              required
            />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="hosted-domain">
              {t('public~Hosted domain')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={(e) => setHostedDomain(e.currentTarget.value)}
              value={hostedDomain}
              id="hosted-domain"
              aria-describedby="idp-hosted-domain-help"
              required
            />
            <p className="help-block" id="idp-hosted-domain-help">
              {t('public~Restrict users to a Google App domain.')}
            </p>
          </div>
          <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" variant="primary" data-test-id="add-idp">
                {t('public~Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={history.goBack}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    </div>
  );
};

export type AddGooglePageState = {
  name: string;
  hostedDomain: string;
  clientID: string;
  clientSecret: string;
  inProgress: boolean;
  errorMessage: string;
};
