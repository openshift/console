import { useState } from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { SecretModel, ConfigMapModel } from '../../models';
import type { IdentityProvider, OAuthKind } from '../../module/k8s';
import { k8sCreate } from '../../module/k8s';
import { ButtonBar } from '../utils/button-bar';
import { IDPCAFileInput } from './idp-cafile-input';
import { IDPNameInput } from './idp-name-input';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from '.';

export const AddGitLabPage = () => {
  const navigate = useNavigate();
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('gitlab');
  const [clientID, setClientID] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [url, setUrl] = useState('');
  const [caFileContent, setCaFileContent] = useState('');

  const { t } = useTranslation('public');

  const thenPromise = (res) => {
    setInProgress(false);
    setErrorMessage('');
    return res;
  };

  const catchError = (error) => {
    const err = error.message || t('An error occurred. Please try again.');
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

  const submit = async (e) => {
    e.preventDefault();

    // Clear any previous errors.
    setErrorMessage('');
    try {
      const oauth: OAuthKind = await getOAuthResource();
      const mockCA = caFileContent ? mockNames.ca : '';
      await addGitLabIDP(oauth, mockNames.secret, mockCA, true);
      const [secret, configMap] = await Promise.all([createClientSecret(), createCAConfigMap()]);
      const caName = configMap ? configMap.metadata.name : '';
      await addGitLabIDP(oauth, secret.metadata.name, caName);
      redirectToOAuthPage(navigate);
    } catch (err) {
      setErrorMessage(err);
    }
  };

  const title = t('Add Identity Provider: GitLab');

  return (
    <div className="co-m-pane__form">
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        helpText={t(
          'You can use GitLab integration for users authenticating with GitLab credentials.',
        )}
      />
      <PaneBody>
        <form onSubmit={submit} name="form">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="co-required" htmlFor="url">
              {t('URL')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="url"
                aria-label={t('URL')}
                onChange={(e) => setUrl(e.currentTarget.value)}
                value={url}
                id="url"
                aria-describedby="idp-url-help"
                required
              />
            </span>
            <p className="help-block" id="idp-url-help">
              {t('The OAuth server base URL.')}
            </p>
          </div>
          <div className="form-group">
            <label className="co-required" htmlFor="client-id">
              {t('Client ID')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="text"
                aria-label={t('Client ID')}
                onChange={(e) => setClientID(e.currentTarget.value)}
                value={clientID}
                id="client-id"
                required
              />
            </span>
          </div>
          <div className="form-group">
            <label className="co-required" htmlFor="client-secret">
              {t('Client secret')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="password"
                aria-label={t('Client secret')}
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
              <Button type="submit" variant="primary" data-test-id="add-idp" data-test="add-idp">
                {t('Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                {t('Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </PaneBody>
    </div>
  );
};
