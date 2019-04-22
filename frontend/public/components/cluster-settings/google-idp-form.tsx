/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Helmet } from 'react-helmet';

import { SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, MappingMethodType, OAuthKind } from '../../module/k8s';
import { ButtonBar, PromiseComponent, history } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage } from './';
import { IDPNameInput } from './idp-name-input';
import { MappingMethod } from './mapping-method';


export class AddGooglePage extends PromiseComponent<{}, AddGooglePageState> {
  readonly state: AddGooglePageState = {
    name: 'google',
    mappingMethod: 'claim',
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

  addGoogleIDP(oauth: OAuthKind, clientSecretName: string): Promise<K8sResourceKind> {
    const { name, mappingMethod, clientID, hostedDomain } = this.state;
    const idp: IdentityProvider = {
      name,
      type: 'Google',
      mappingMethod,
      google: {
        hostedDomain,
        clientID,
        clientSecret: {
          name: clientSecretName,
        },
      },
    };

    return this.handlePromise(addIDP(oauth, idp));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // Clear any previous errors.
    this.setState({errorMessage: ''});
    this.getOAuthResource().then((oauth: OAuthKind) => {
      return this.createClientSecret()
        .then((secret: K8sResourceKind) => this.addGoogleIDP(oauth, secret.metadata.name))
        .then(redirectToOAuthPage);
    });
  };

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({name: event.currentTarget.value});
  };

  clientIDChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({clientID: event.currentTarget.value});
  };

  clientSecretChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({clientSecret: event.currentTarget.value});
  };

  hostedDomainChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({hostedDomain: event.currentTarget.value});
  };

  mappingMethodChanged = (mappingMethod: MappingMethodType) => {
    this.setState({mappingMethod});
  };

  render() {
    const { name, mappingMethod, clientID, clientSecret, hostedDomain } = this.state;
    const title = 'Add Identity Provider: Google';
    return <div className="co-m-pane__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
        <h1 className="co-m-pane__heading">{title}</h1>
        <p className="co-m-pane__explanation">
          You can use Google integration for users authenticating with Google credentials.
        </p>
        <IDPNameInput value={name} onChange={this.nameChanged} />
        <MappingMethod value={mappingMethod} onChange={this.mappingMethodChanged} />
        <div className="form-group">
          <label className="control-label co-required" htmlFor="client-id">Client ID</label>
          <input className="form-control"
            type="text"
            onChange={this.clientIDChanged}
            value={clientID}
            id="client-id"
            required />
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="client-secret">Client Secret</label>
          <input className="form-control"
            type="password"
            onChange={this.clientSecretChanged}
            value={clientSecret}
            id="client-secret"
            required />
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="hosted-domain">Hosted Domain</label>
          <input className="form-control"
            type="text"
            onChange={this.hostedDomainChanged}
            value={hostedDomain}
            id="hosted-domain"
            aria-describedby="idp-hosted-domain-help" />
          <p className="help-block" id="idp-hosted-domain-help">
            Optionally restrict users to a Google App domain.
          </p>
        </div>
        <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
          <button type="submit" className="btn btn-primary">Add</button>
          <button type="button" className="btn btn-default" onClick={history.goBack}>Cancel</button>
        </ButtonBar>
      </form>
    </div>;
  }
}

type AddGooglePageState = {
  name: string;
  mappingMethod: MappingMethodType;
  hostedDomain: string
  clientID: string;
  clientSecret: string;
  inProgress: boolean;
  errorMessage: string;
};
