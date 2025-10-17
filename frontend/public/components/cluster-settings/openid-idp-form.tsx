import { useState } from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { ActionGroup, Button, Title } from '@patternfly/react-core';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar, ListInput } from '../utils';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const AddOpenIDIDPPage = () => {
  const navigate = useNavigate();
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('openid');
  const [clientID, setClientID] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [claimPreferredUsernames, setClaimPreferredUsernames] = useState(['preferred_username']);
  const [claimNames, setClaimNames] = useState(['name']);
  const [claimEmails, setClaimEmails] = useState(['email']);
  const [issuer, setIssuer] = useState('');
  const [caFileContent, setCaFileContent] = useState('');
  const [extraScopes, setExtraScopes] = useState([]);

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
            .then(() => {
              redirectToOAuthPage(navigate);
            });
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: OpenID Connect');

  return (
    <div className="co-m-pane__form">
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        helpText={t(
          'public~Integrate with an OpenID Connect identity provider using an Authorization Code Flow.',
        )}
      />
      <PaneBody>
        <form onSubmit={submit} name="form">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="co-required" htmlFor="client-id">
              {t('public~Client ID')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="text"
                aria-label={t('public~Client ID')}
                onChange={(e) => setClientID(e.currentTarget.value)}
                value={clientID}
                id="client-id"
                required
              />
            </span>
          </div>
          <div className="form-group">
            <label className="co-required" htmlFor="client-secret">
              {t('public~Client secret')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="password"
                aria-label={t('public~Client secret')}
                onChange={(e) => setClientSecret(e.currentTarget.value)}
                value={clientSecret}
                id="client-secret"
                required
              />
            </span>
          </div>
          <div className="form-group">
            <label className="co-required" htmlFor="issuer">
              {t('public~Issuer URL')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="url"
                aria-label={t('public~Issuer URL')}
                onChange={(e) => setIssuer(e.currentTarget.value)}
                value={issuer}
                id="issuer"
                required
                aria-describedby="issuer-help"
              />
            </span>
            <div className="help-block" id="issuer-help">
              {t(
                'public~The URL that the OpenID provider asserts as its issuer identifier. It must use the https scheme with no URL query parameters or fragment.',
              )}
            </div>
          </div>
          <div className="co-form-section__separator" />
          <div>
            <Title headingLevel="h3" className="pf-v6-u-mb-sm">
              {t('public~Claims')}
            </Title>
            <p>
              {t(
                'public~Claims map metadata from the OpenID provider to an OpenShift user. The first non-empty claim is used.',
              )}
            </p>
            <ListInput
              label={t('public~Preferred username')}
              id="openid-claims-preferred-username"
              initialValues={claimPreferredUsernames}
              onChange={(c: string[]) => setClaimPreferredUsernames(c)}
              helpText={t('public~Any scopes to request in addition to the standard openid scope.')}
            />
            <ListInput
              label={t('public~Name')}
              id="openid-claims-name"
              initialValues={claimNames}
              onChange={(c: string[]) => setClaimNames(c)}
              helpText={t(
                'public~The list of claims whose values should be used as the display name.',
              )}
            />
            <ListInput
              label={t('public~Email')}
              id="openid-claims-email"
              initialValues={claimEmails}
              onChange={(c: string[]) => setClaimEmails(c)}
              helpText={t(
                'public~The list of claims whose values should be used as the email address.',
              )}
            />
          </div>
          <div className="co-form-section__separator" />
          <div data-test="openid-more-options-list-input">
            <Title headingLevel="h3" className="pf-v6-u-mb-sm">
              {t('public~More options')}
            </Title>
            <IDPCAFileInput
              id="ca-file-input"
              value={caFileContent}
              onChange={(c: string) => setCaFileContent(c)}
            />
            <ListInput
              label={t('public~Extra scopes')}
              id="openid-more-options-extra-scopes"
              onChange={(c: string[]) => setExtraScopes(c)}
              helpText={t('public~Any scopes to request in addition to the standard openid scope.')}
            />
          </div>
          <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
            <ActionGroup className="pf-v6-c-form">
              <Button type="submit" variant="primary" data-test-id="add-idp">
                {t('public~Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </PaneBody>
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
