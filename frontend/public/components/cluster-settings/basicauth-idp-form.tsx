import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar, history, AsyncComponent, PageHeading } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const DroppableFileInput = (props: any) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);
export const AddBasicAuthPage: React.FC = () => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('basic-auth');
  const [url, setUrl] = React.useState('');
  const [caFileContent, setCaFileContent] = React.useState('');
  const [certFileContent, setCertFileContent] = React.useState('');
  const [keyFileContent, setKeyFileContent] = React.useState('');

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

  const createTLSSecret = () => {
    if (!certFileContent) {
      return Promise.resolve(null);
    }

    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'basic-auth-tls-',
        namespace: 'openshift-config',
      },
      stringData: {
        'tls.crt': certFileContent,
        'tls.key': keyFileContent,
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
        generateName: 'basic-auth-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return handlePromise(k8sCreate(ConfigMapModel, ca));
  };

  const addBasicAuthIDP = (
    oauth: OAuthKind,
    secretName: string,
    caName: string,
    dryRun?: boolean,
  ) => {
    const idp: IdentityProvider = {
      name,
      type: 'BasicAuth',
      mappingMethod: 'claim',
      basicAuth: {
        url,
      },
    };

    if (caName) {
      idp.basicAuth.ca = {
        name: caName,
      };
    }

    if (secretName) {
      idp.basicAuth.tlsClientCert = {
        name: secretName,
      };
      idp.basicAuth.tlsClientKey = {
        name: secretName,
      };
    }

    return handlePromise(addIDP(oauth, idp, dryRun));
  };

  const submit = (e) => {
    e.preventDefault();
    if (_.isEmpty(keyFileContent) !== _.isEmpty(certFileContent)) {
      setErrorMessage(
        t('public~Values for certificate and key should both be either excluded or provided.'),
      );
      return;
    }
    // Clear any previous errors.
    setErrorMessage('');
    getOAuthResource().then((oauth: OAuthKind) => {
      const mockSecret = certFileContent ? mockNames.secret : '';
      const mockCA = caFileContent ? mockNames.ca : '';
      addBasicAuthIDP(oauth, mockSecret, mockCA, true)
        .then(() => {
          const promises = [createTLSSecret(), createCAConfigMap()];

          Promise.all(promises)
            .then(([tlsSecret, configMap]) => {
              const caName = configMap ? configMap.metadata.name : '';
              const secretName = tlsSecret ? tlsSecret.metadata.name : '';
              return addBasicAuthIDP(oauth, secretName, caName);
            })
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: Basic Authentication');

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        helpText={t(
          'public~Basic authentication is a generic backend integration mechanism that allows users to authenticate with credentials validated against a remote identity provider.',
        )}
      />
      <div className="co-m-pane__body">
        <form onSubmit={submit} name="form" className="co-m-pane__body-group">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="url">
              {t('public~URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={(e) => setUrl(e.currentTarget.value)}
              value={url}
              id="url"
              aria-describedby="idp-url-help"
              required
            />
            <p className="help-block" id="idp-url-help">
              {t('public~The remote URL to connect to.')}
            </p>
          </div>
          <IDPCAFileInput value={caFileContent} onChange={(c: string) => setCaFileContent(c)} />
          <div className="form-group">
            <DroppableFileInput
              onChange={(c: string) => setCertFileContent(c)}
              inputFileData={certFileContent}
              id="cert-file-input"
              label={t('public~Certificate')}
              hideContents
              inputFieldHelpText={t(
                'public~PEM-encoded TLS client certificate to present when connecting to the server.',
              )}
            />
          </div>
          <div className="form-group">
            <DroppableFileInput
              onChange={(c: string) => setKeyFileContent(c)}
              inputFileData={keyFileContent}
              id="key-file-input"
              label={t('public~Key')}
              hideContents
              inputFieldHelpText={t(
                'public~PEM-encoded TLS private key for the client certificate. Required if certificate is specified.',
              )}
            />
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

export type AddBasicAuthPageState = {
  name: string;
  url: string;
  caFileContent: string;
  certFileContent: string;
  keyFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
