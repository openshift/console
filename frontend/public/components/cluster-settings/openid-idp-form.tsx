/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Helmet } from 'react-helmet';

import { SecretModel, ConfigMapModel } from '../../models';
import {
  IdentityProvider,
  k8sCreate,
  K8sResourceKind,
  MappingMethodType,
  OAuthKind,
} from '../../module/k8s';
import {
  ButtonBar,
  ListInput,
  PromiseComponent,
  history,
} from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage } from './';
import { IDPNameInput } from './idp-name-input';
import { MappingMethod } from './mapping-method';
import { IDPCAFileInput } from './idp-cafile-input';

export class AddOpenIDPage extends PromiseComponent {
  readonly state: AddOpenIDIDPPageState = {
    name: 'openid',
    mappingMethod: 'claim',
    clientID: '',
    clientSecret: '',
    claimPreferredUsernames: ['preferred_username'],
    claimNames: ['name'],
    claimEmails: ['email'],
    issuer: '',
    caFileContent: '',
    extraScopes: [],
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
        generateName: 'openid-client-secret-',
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
        generateName: 'openid-ca-',
        namespace: 'openshift-config',
      },
      stringData: {
        'ca.crt': caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  addOpenIDIDP(oauth: OAuthKind, clientSecretName: string, caName: string): Promise<K8sResourceKind> {
    const { name, mappingMethod, clientID, issuer, extraScopes, claimPreferredUsernames, claimNames, claimEmails } = this.state;
    const idp: IdentityProvider = {
      name,
      type: 'OpenID',
      mappingMethod,
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

    return this.handlePromise(addIDP(oauth, idp));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!this.state.clientSecret) {
      this.setState({errorMessage: 'You must specify a client secret.'});
      return;
    }

    // Clear any previous errors.
    this.setState({errorMessage: ''});
    this.getOAuthResource().then((oauth: OAuthKind) => {
      const promises = [
        this.createClientSecret(),
        this.createCAConfigMap(),
      ];

      Promise.all(promises).then(([secret, configMap]) => {
        const caName = configMap ? configMap.metadata.name : '';
        return this.addOpenIDIDP(oauth, secret.metadata.name, caName);
      }).then(redirectToOAuthPage);
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

  issuerChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({issuer: event.currentTarget.value});
  };

  claimPreferredUsernamesChanged = (claimPreferredUsernames: string[]) => {
    this.setState({claimPreferredUsernames});
  };

  claimNamesChanged = (claimNames: string[]) => {
    this.setState({claimNames});
  };

  claimEmailsChanged = (claimEmails: string[]) => {
    this.setState({claimEmails});
  };

  extraScopesChanged = (extraScopes: string[]) => {
    this.setState({extraScopes});
  };

  mappingMethodChanged = (mappingMethod: string) => {
    this.setState({mappingMethod});
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({caFileContent});
  };

  render() {
    const { name, mappingMethod, clientID, clientSecret, issuer, claimPreferredUsernames, claimNames, claimEmails, caFileContent } = this.state;
    const title = 'Add Identity Provider: OpenID Connect';
    return <div className="co-m-pane__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
        <h1 className="co-m-pane__heading">{title}</h1>
        <p className="co-m-pane__explanation">
          Integrate with an OpenID Connect identity provider using an Authorization Code Flow.
        </p>
        <IDPNameInput value={name} onChange={this.nameChanged} />
        <MappingMethod value={mappingMethod} onChange={this.mappingMethodChanged} />
        <div className="form-group">
          <label className="control-label co-required" htmlFor="clientID">Client ID</label>
          <input className="form-control"
            type="text"
            onChange={this.clientIDChanged}
            value={clientID}
            id="clientID"
            required />
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="clientSecret">Client Secret</label>
          <input className="form-control"
            type="password"
            onChange={this.clientSecretChanged}
            value={clientSecret}
            id="clientSecret"
            required />
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="issuer">Issuer URL</label>
          <input className="form-control"
            type="text"
            onChange={this.issuerChanged}
            value={issuer}
            id="issuer"
            required
            aria-describedby="issuer-help" />
          <div className="help-block" id="issuer-help">
            The URL that the OpenID Provider asserts as its Issuer Identifier.
            It must use the https scheme with no URL query parameters or fragment.
          </div>
        </div>
        <div className="co-form-section__separator"></div>
        <h3>Claims</h3>
        <p className="co-help-text">Claims map metadata from the OpenID provider to an OpenShift user. The first non-empty claim is used.</p>
        <ListInput label="Preferred Username" initialValues={claimPreferredUsernames} onChange={this.claimPreferredUsernamesChanged} />
        <ListInput label="Name" initialValues={claimNames} onChange={this.claimNamesChanged} />
        <ListInput label="Email" initialValues={claimEmails} onChange={this.claimEmailsChanged} />
        <div className="co-form-section__separator"></div>
        <h3>More Options</h3>
        <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} />
        <ListInput label="Extra Scopes" onChange={this.extraScopesChanged} />
        <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
          <button type="submit" className="btn btn-primary">Add</button>
          <button type="button" className="btn btn-default" onClick={history.goBack}>Cancel</button>
        </ButtonBar>
      </form>
    </div>;
  }
}

type AddOpenIDIDPPageState = {
  name: string;
  mappingMethod: MappingMethodType;
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
