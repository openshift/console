import * as React from 'react';
import { Helmet } from 'react-helmet';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { ButtonBar, PromiseComponent, history } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';

class AddGooglePageWithTranslation extends PromiseComponent<
  AddGooglePageProps,
  AddGooglePageState
> {
  readonly state: AddGooglePageState = {
    name: 'google',
    clientID: '',
    clientSecret: '',
    hostedDomain: '',
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
        generateName: 'google-client-secret-',
        namespace: 'openshift-config',
      },
      stringData: {
        clientSecret,
      },
    };

    return this.handlePromise(k8sCreate(SecretModel, secret));
  }

  addGoogleIDP(
    oauth: OAuthKind,
    clientSecretName: string,
    dryRun?: boolean,
  ): Promise<K8sResourceKind> {
    const { name, clientID, hostedDomain } = this.state;
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

    return this.handlePromise(addIDP(oauth, idp, dryRun));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // Clear any previous errors.
    this.setState({ errorMessage: '' });
    this.getOAuthResource().then((oauth: OAuthKind) => {
      this.addGoogleIDP(oauth, mockNames.secret, true)
        .then(() => {
          return this.createClientSecret()
            .then((secret: K8sResourceKind) => this.addGoogleIDP(oauth, secret.metadata.name))
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

  hostedDomainChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ hostedDomain: event.currentTarget.value });
  };

  render() {
    const { name, clientID, clientSecret, hostedDomain } = this.state;
    const { t } = this.props;
    const title = t('google-idp-form~Add Identity Provider: Google');
    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
          <h1 className="co-m-pane__heading">{title}</h1>
          <p className="co-m-pane__explanation">
            {t(
              'google-idp-form~You can use Google integration for users authenticating with Google credentials.',
            )}
          </p>
          <IDPNameInput value={name} onChange={this.nameChanged} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-id">
              {t('google-idp-form~Client ID')}
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
              {t('google-idp-form~Client secret')}
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
          <div className="form-group">
            <label className="control-label co-required" htmlFor="hosted-domain">
              {t('google-idp-form~Hosted domain')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={this.hostedDomainChanged}
              value={hostedDomain}
              id="hosted-domain"
              aria-describedby="idp-hosted-domain-help"
              required
            />
            <p className="help-block" id="idp-hosted-domain-help">
              {t('google-idp-form~Restrict users to a Google App domain.')}
            </p>
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

export const AddGooglePage = withTranslation()(AddGooglePageWithTranslation);

export type AddGooglePageState = {
  name: string;
  hostedDomain: string;
  clientID: string;
  clientSecret: string;
  inProgress: boolean;
  errorMessage: string;
};

type AddGooglePageProps = {
  t: TFunction;
};
