import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { ActionGroup, Button } from '@patternfly/react-core';
import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar, AsyncComponent, PageHeading } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const DroppableFileInput = (props: any) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);

export const AddKeystonePage = () => {
  const navigate = useNavigate();
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('keystone');
  const [domainName, setDomainName] = React.useState('');
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
        generateName: 'keystone-tls-',
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
        generateName: 'keystone-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return handlePromise(k8sCreate(ConfigMapModel, ca));
  };

  const addKeystoneIDP = (
    oauth: OAuthKind,
    secretName: string,
    caName: string,
    dryRun?: boolean,
  ) => {
    const idp: IdentityProvider = {
      name,
      type: 'Keystone',
      mappingMethod: 'claim',
      keystone: {
        domainName,
        url,
      },
    };

    if (caName) {
      idp.keystone.ca = {
        name: caName,
      };
    }

    if (secretName) {
      idp.keystone.tlsClientCert = {
        name: secretName,
      };
      idp.keystone.tlsClientKey = {
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
      addKeystoneIDP(oauth, mockSecret, mockCA, true)
        .then(() => {
          const promises = [createTLSSecret(), createCAConfigMap()];

          Promise.all(promises)
            .then(([tlsSecret, configMap]) => {
              const caName = configMap ? configMap.metadata.name : '';
              const secretName = tlsSecret ? tlsSecret.metadata.name : '';
              return addKeystoneIDP(oauth, secretName, caName);
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

  const title = t('public~Add Identity Provider: Keystone Authentication');

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        helpText={t(
          'public~Adding Keystone enables shared authentication with an OpenStack server configured to store users in an internal Keystone database.',
        )}
      />
      <div className="co-m-pane__body">
        <form onSubmit={submit} name="form" className="co-m-pane__body-group">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="domain-name">
              {t('public~Domain name')}
            </label>
            <input
              className="pf-v5-c-form-control"
              type="text"
              onChange={(e) => setDomainName(e.currentTarget.value)}
              value={domainName}
              id="domain-name"
              required
            />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="url">
              {t('public~URL')}
            </label>
            <input
              className="pf-v5-c-form-control"
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
            <ActionGroup className="pf-v5-c-form">
              <Button type="submit" variant="primary" data-test-id="add-idp">
                {t('public~Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    </div>
  );
};

export type AddKeystonePageState = {
  name: string;
  domainName: string;
  url: string;
  caFileContent: string;
  certFileContent: string;
  keyFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
