import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar, ListInput, history, PageHeading } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const AddOpenIDIDPPage = () => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('openid');
  const [clientID, setClientID] = React.useState('');
  const [clientSecret, setClientSecret] = React.useState('');
  const [claimPreferredUsernames, setClaimPreferredUsernames] = React.useState([
    'preferred_username',
  ]);
  const [claimNames, setClaimNames] = React.useState(['name']);
  const [claimEmails, setClaimEmails] = React.useState(['email']);
  const [issuer, setIssuer] = React.useState('');
  const [caFileContent, setCaFileContent] = React.useState('');
  const [extraScopes, setExtraScopes] = React.useState([]);

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
        generateName: 'openid-client-secret-',
        namespace: 'openshift-config',
      },
      stringData: {
        clientSecret,
      },
    };

    return handlePromise(k8sCreate(SecretModel, secret));
  };

  const createCAConfigMap = () => {
    if (!caFileContent) {
      return Promise.resolve(null);
    }

    const ca = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        generateName: 'openid-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return handlePromise(k8sCreate(ConfigMapModel, ca));
  };

  const addOpenIDIDP = (
    oauth: OAuthKind,
    clientSecretName: string,
    caName: string,
    dryRun?: boolean,
  ) => {
    const idp: IdentityProvider = {
      name,
      type: 'OpenID',
      mappingMethod: 'claim',
      openID: {
        clientID,
        clientSecret: {
          name: clientSecretName,
        },
        issuer,
        extraScopes,
        claims: {
          preferredUsername: claimPreferredUsernames,
          name: claimNames,
          email: claimEmails,
        },
      },
    };

    if (caName) {
      idp.openID.ca = {
        name: caName,
      };
    }

    return handlePromise(addIDP(oauth, idp, dryRun));
  };

  const submit = (e) => {
    e.preventDefault();

    // Clear any previous errors.
    setErrorMessage('');
    getOAuthResource().then((oauth: OAuthKind) => {
      const mockCA = caFileContent ? mockNames.ca : '';
      addOpenIDIDP(oauth, mockNames.secret, mockCA, true)
        .then(() => {
          const promises = [createClientSecret(), createCAConfigMap()];

          Promise.all(promises)
            .then(([secret, configMap]) => {
              const caName = configMap ? configMap.metadata.name : '';
              return addOpenIDIDP(oauth, secret.metadata.name, caName);
            })
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: OpenID Connect');

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        helpText={t(
          'public~Integrate with an OpenID Connect identity provider using an Authorization Code Flow.',
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
            <label className="control-label co-required" htmlFor="issuer">
              {t('public~Issuer URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={(e) => setIssuer(e.currentTarget.value)}
              value={issuer}
              id="issuer"
              required
              aria-describedby="issuer-help"
            />
            <div className="help-block" id="issuer-help">
              {t(
                'public~The URL that the OpenID provider asserts as its issuer identifier. It must use the https scheme with no URL query parameters or fragment.',
              )}
            </div>
          </div>
          <div className="co-form-section__separator" />
          <h3>{t('public~Claims')}</h3>
          <p className="co-help-text">
            {t(
              'public~Claims map metadata from the OpenID provider to an OpenShift user. The first non-empty claim is used.',
            )}
          </p>
          <ListInput
            label={t('public~Preferred username')}
            initialValues={claimPreferredUsernames}
            onChange={(c: string[]) => setClaimPreferredUsernames(c)}
            helpText={t('public~Any scopes to request in addition to the standard openid scope.')}
          />
          <ListInput
            label={t('public~Name')}
            initialValues={claimNames}
            onChange={(c: string[]) => setClaimNames(c)}
            helpText={t(
              'public~The list of claims whose values should be used as the display name.',
            )}
          />
          <ListInput
            label={t('public~Email')}
            initialValues={claimEmails}
            onChange={(c: string[]) => setClaimEmails(c)}
            helpText={t(
              'public~The list of claims whose values should be used as the email address.',
            )}
          />
          <div className="co-form-section__separator" />
          <h3>{t('public~More options')}</h3>
          <IDPCAFileInput value={caFileContent} onChange={(c: string) => setCaFileContent(c)} />
          <ListInput
            label={t('public~Extra scopes')}
            onChange={(c: string[]) => setExtraScopes(c)}
            helpText={t('public~Any scopes to request in addition to the standard openid scope.')}
          />
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

export type AddOpenIDIDPPageState = {
  name: string;
  clientID: string;
  clientSecret: string;
  claimPreferredUsernames: string[];
  claimNames: string[];
  claimEmails: string[];
  issuer: string;
  caFileContent: string;
  extraScopes: string[];
  inProgress: boolean;
  errorMessage: string;
};
