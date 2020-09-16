import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash-es';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { ButtonBar, PromiseComponent, history, AsyncComponent } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const DroppableFileInput = (props: any) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);

class AddBasicAuthPageWithTranslation extends PromiseComponent<
  AddBasicAuthPageProps,
  AddBasicAuthPageState
> {
  readonly state: AddBasicAuthPageState = {
    name: 'basic-auth',
    url: '',
    caFileContent: '',
    certFileContent: '',
    keyFileContent: '',
    inProgress: false,
    errorMessage: '',
  };

  getOAuthResource(): Promise<OAuthKind> {
    return this.handlePromise(getOAuthResource());
  }

  createTLSSecret(): Promise<K8sResourceKind> {
    const { certFileContent, keyFileContent } = this.state;
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

    return this.handlePromise(k8sCreate(SecretModel, secret));
  }

  createCAConfigMap(): Promise<K8sResourceKind> {
    const { caFileContent } = this.state;
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

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  addBasicAuthIDP(
    oauth: OAuthKind,
    secretName: string,
    caName: string,
    dryRun?: boolean,
  ): Promise<K8sResourceKind> {
    const { name, url } = this.state;
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

    return this.handlePromise(addIDP(oauth, idp, dryRun));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (_.isEmpty(this.state.keyFileContent) !== _.isEmpty(this.state.certFileContent)) {
      this.setState({
        errorMessage: this.props.t(
          'basicauth-idp-form~Values for certificate and key should both be either excluded or provided.',
        ),
      });
      return;
    }
    // Clear any previous errors.
    this.setState({ errorMessage: '' });
    this.getOAuthResource().then((oauth: OAuthKind) => {
      const mockSecret = this.state.certFileContent ? mockNames.secret : '';
      const mockCA = this.state.caFileContent ? mockNames.ca : '';
      this.addBasicAuthIDP(oauth, mockSecret, mockCA, true)
        .then(() => {
          const promises = [this.createTLSSecret(), this.createCAConfigMap()];

          Promise.all(promises)
            .then(([tlsSecret, configMap]) => {
              const caName = configMap ? configMap.metadata.name : '';
              const secretName = tlsSecret ? tlsSecret.metadata.name : '';
              return this.addBasicAuthIDP(oauth, secretName, caName);
            })
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          this.setState({ errorMessage: err });
        });
    });
  };

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ name: event.currentTarget.value });
  };

  urlChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ url: event.currentTarget.value });
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({ caFileContent });
  };

  certFileChanged = (certFileContent: string) => {
    this.setState({ certFileContent });
  };

  keyFileChanged = (keyFileContent: string) => {
    this.setState({ keyFileContent });
  };

  render() {
    const { name, url, caFileContent, certFileContent, keyFileContent } = this.state;
    const { t } = this.props;
    const title = t('basicauth-idp-form~Add Identity Provider: Basic Authentication');
    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
          <h1 className="co-m-pane__heading">{title}</h1>
          <p className="co-m-pane__explanation">
            {t(
              'basicauth-idp-form~Basic authentication is a generic backend integration mechanism that allows users to authenticate with credentials validated against a remote identity provider.',
            )}
          </p>
          <IDPNameInput value={name} onChange={this.nameChanged} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="url">
              {t('basicauth-idp-form~URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={this.urlChanged}
              value={url}
              id="url"
              aria-describedby="idp-url-help"
              required
            />
            <p className="help-block" id="idp-url-help">
              {t('basicauth-idp-form~The remote URL to connect to.')}
            </p>
          </div>
          <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} />
          <div className="form-group">
            <DroppableFileInput
              onChange={this.certFileChanged}
              inputFileData={certFileContent}
              id="cert-file-input"
              label={t('basicauth-idp-form~Certificate')}
              hideContents
              inputFieldHelpText={t(
                'basicauth-idp-form~PEM-encoded TLS client certificate to present when connecting to the server.',
              )}
            />
          </div>
          <div className="form-group">
            <DroppableFileInput
              onChange={this.keyFileChanged}
              inputFileData={keyFileContent}
              id="key-file-input"
              label={t('basicauth-idp-form~Key')}
              hideContents
              inputFieldHelpText={t(
                'basicauth-idp-form~PEM-encoded TLS private key for the client certificate. Required if certificate is specified.',
              )}
            />
          </div>
          <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
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
    );
  }
}

export const AddBasicAuthPage = withTranslation()(AddBasicAuthPageWithTranslation);

export type AddBasicAuthPageState = {
  name: string;
  url: string;
  caFileContent: string;
  certFileContent: string;
  keyFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};

type AddBasicAuthPageProps = {
  t: TFunction;
};
