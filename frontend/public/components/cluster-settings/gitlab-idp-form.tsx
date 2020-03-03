import * as React from 'react';
import { Helmet } from 'react-helmet';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { ButtonBar, PromiseComponent, history } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export class AddGitLabPage extends PromiseComponent<{}, AddGitLabPageState> {
  readonly state: AddGitLabPageState = {
    name: 'gitlab',
    clientID: '',
    clientSecret: '',
    url: '',
    caFileContent: '',
    inProgress: false,
    errorMessage: '',
  };

  getOAuthResource(): Promise<OAuthKind> {
    return this.handlePromise(getOAuthResource());
  }

  createClientSecret(): Promise<K8sResourceKind> {
    const { clientSecret } = this.state;
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
        generateName: 'gitlab-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  addGitLabIDP(
    oauth: OAuthKind,
    clientSecretName: string,
    caName: string,
    dryRun?: boolean,
  ): Promise<K8sResourceKind> {
    const { name, clientID, url } = this.state;
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

    return this.handlePromise(addIDP(oauth, idp, dryRun));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // Clear any previous errors.
    this.setState({ errorMessage: '' });
    this.getOAuthResource().then((oauth: OAuthKind) => {
      const mockCA = this.state.caFileContent ? mockNames.ca : '';
      this.addGitLabIDP(oauth, mockNames.secret, mockCA, true)
        .then(() => {
          const promises = [this.createClientSecret(), this.createCAConfigMap()];

          Promise.all(promises)
            .then(([secret, configMap]) => {
              const caName = configMap ? configMap.metadata.name : '';
              return this.addGitLabIDP(oauth, secret.metadata.name, caName);
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

  clientIDChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ clientID: event.currentTarget.value });
  };

  clientSecretChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ clientSecret: event.currentTarget.value });
  };

  urlChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ url: event.currentTarget.value });
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({ caFileContent });
  };

  render() {
    const { name, clientID, clientSecret, url, caFileContent } = this.state;
    const title = 'Add Identity Provider: GitLab';
    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
          <h1 className="co-m-pane__heading">{title}</h1>
          <p className="co-m-pane__explanation">
            You can use GitLab integration for users authenticating with GitLab credentials.
          </p>
          <IDPNameInput value={name} onChange={this.nameChanged} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="url">
              URL
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
              The OAuth server base URL.
            </p>
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-id">
              Client ID
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={this.clientIDChanged}
              value={clientID}
              id="client-id"
              required
            />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-secret">
              Client Secret
            </label>
            <input
              className="pf-c-form-control"
              type="password"
              onChange={this.clientSecretChanged}
              value={clientSecret}
              id="client-secret"
              required
            />
          </div>
          <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} />
          <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" variant="primary" data-test-id="add-idp">
                Add
              </Button>
              <Button type="button" variant="secondary" onClick={history.goBack}>
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    );
  }
}

export type AddGitLabPageState = {
  name: string;
  url: string;
  clientID: string;
  clientSecret: string;
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
