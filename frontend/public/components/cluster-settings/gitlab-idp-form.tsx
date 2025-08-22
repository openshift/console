import { useState } from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ActionGroup, Button } from '@patternfly/react-core';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const AddGitLabPage = () => {
  const navigate = useNavigate();
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('gitlab');
  const [clientID, setClientID] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [url, setUrl] = useState('');
  const [caFileContent, setCaFileContent] = useState('');

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
        generateName: 'gitlab-client-secret-',
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
        generateName: 'gitlab-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return handlePromise(k8sCreate(ConfigMapModel, ca));
  };

  const addGitLabIDP = (
    oauth: OAuthKind,
    clientSecretName: string,
    caName: string,
    dryRun?: boolean,
  ) => {
    const idp: IdentityProvider = {
      name,
      type: 'GitLab',
      mappingMethod: 'claim',
      gitlab: {
        url,
        clientID,
        clientSecret: {
          name: clientSecretName,
        },
      },
    };

    if (caName) {
      idp.gitlab.ca = {
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
      addGitLabIDP(oauth, mockNames.secret, mockCA, true)
        .then(() => {
          const promises = [createClientSecret(), createCAConfigMap()];

          Promise.all(promises)
            .then(([secret, configMap]) => {
              const caName = configMap ? configMap.metadata.name : '';
              return addGitLabIDP(oauth, secret.metadata.name, caName);
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

  const title = t('public~Add Identity Provider: GitLab');

  return (
    <div className="co-m-pane__form">
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        helpText={t(
          'public~You can use GitLab integration for users authenticating with GitLab credentials.',
        )}
      />
      <PaneBody>
        <form onSubmit={submit} name="form">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="co-required" htmlFor="url">
              {t('public~URL')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="url"
                aria-label={t('public~URL')}
                onChange={(e) => setUrl(e.currentTarget.value)}
                value={url}
                id="url"
                aria-describedby="idp-url-help"
                required
              />
            </span>
            <p className="help-block" id="idp-url-help">
              {t('public~The OAuth server base URL.')}
            </p>
          </div>
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
          <IDPCAFileInput
            id="ca-file-input"
            value={caFileContent}
            onChange={(c: string) => setCaFileContent(c)}
          />
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

export type AddGitLabPageState = {
  name: string;
  url: string;
  clientID: string;
  clientSecret: string;
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
