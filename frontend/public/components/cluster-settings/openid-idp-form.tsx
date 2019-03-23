/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';

import { OAuthModel, SecretModel, ConfigMapModel } from '../../models';
import { k8sCreate, k8sGet, k8sPatch, K8sResourceKind, referenceFor } from '../../module/k8s';
import {
  AsyncComponent,
  ButtonBar,
  Dropdown,
  PromiseComponent,
  history,
  resourceObjPath,
} from '../utils';

// The name of the cluster-scoped OAuth configuration resource.
const oauthResourceName = 'cluster';

const DroppableFileInput = (props) => <AsyncComponent loader={() => import('../utils/file-input').then(c => c.DroppableFileInput)} {...props} />;

export class AddOpenIDPage extends PromiseComponent {
  readonly state: AddOpenIDIDPPageState = {
    name: 'openidconnect',
    mappingMethod: 'claim',
    clientID: '',
    clientSecretFileContent: '',
    preferredUserName: 'preferred_username',
    claimName: 'name',
    claimEmail: 'email',
    issuer: '',
    caFileContent: '',
    inProgress: false,
    errorMessage: '',
  };

  getOAuthResource(): Promise<K8sResourceKind> {
    return this.handlePromise(k8sGet(OAuthModel, oauthResourceName));
  }

  createOIDClientSecret(): Promise<K8sResourceKind> {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'openid-client-secret-',
        namespace: 'openshift-config',
      },
      stringData: {
        clientSecret: this.state.clientSecretFileContent,
      },
    };

    return this.handlePromise(k8sCreate(SecretModel, secret));
  }

  createOIDCA(): Promise<K8sResourceKind> {
    const ca = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        generateName: 'openid-config-map-',
        namespace: 'openshift-config',
      },
      stringData: {
        ca: this.state.caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  addOpenIDIDP(oauth: K8sResourceKind, secretName: string, caName: string): Promise<K8sResourceKind> {
    const { name, mappingMethod, clientID, issuer, preferredUserName, claimName, claimEmail } = this.state;
    const openID = _.isEmpty(caName) ? {
      name,
      type: 'OpenID',
      mappingMethod,
      openID: {
        clientID,
        clientSecret: {
          name: secretName,
        },
        issuer,
        claims: {
          preferredUsername: [preferredUserName],
          name: [claimName],
          email: [claimEmail],
        },
      },
    } : {
      name,
      type: 'OpenID',
      mappingMethod,
      openID: {
        clientID,
        clientSecret: {
          name: secretName,
        },
        ca: {
          name: caName,
        },
        issuer,
        claims: {
          preferredUsername: [preferredUserName],
          name: [claimName],
          email: [claimEmail],
        },
      },
    }
    ;
    const patch = _.isEmpty(oauth.spec.identityProviders)
      ? { op: 'add', path: '/spec/identityProviders', value: [openID] }
      : { op: 'add', path: '/spec/identityProviders/-', value: openID };
    return this.handlePromise(k8sPatch(OAuthModel, oauth, [patch]));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!this.state.clientSecretFileContent) {
      this.setState({errorMessage: 'You must specify a Client Secret file.'});
      return;
    }

    // Clear any previous errors.
    this.setState({errorMessage: ''});
    this.getOAuthResource().then((oauth: K8sResourceKind) => {
      if (_.isEmpty(this.state.caFileContent)) {
        return this.createOIDClientSecret()
          .then((secret: K8sResourceKind) => this.addOpenIDIDP(oauth, secret.metadata.name, ''))
          .then(() => {
            history.push(resourceObjPath(oauth, referenceFor(oauth)));
          });
      }
      let secretValue;
      return this.createOIDClientSecret()
        .then((secret: K8sResourceKind) => {
          secretValue = secret;
          this.createOIDCA()
            .then((ca:K8sResourceKind) => this.addOpenIDIDP(oauth, secretValue.metadata.name, ca.metadata.name));
        })
        .then(() => {
          history.push(resourceObjPath(oauth, referenceFor(oauth)));
        });
    });
  };

  oidTextValueChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({[event.currentTarget.id]: event.currentTarget.value});
  };

  oidCBValueChanged: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({[event.currentTarget.id]: event.currentTarget.checked});
  };

  mappingMethodChanged = (mappingMethod: string) => {
    this.setState({mappingMethod});
  };

  clientSecretFileChanged = (clientSecretFileContent: string) => {
    this.setState({clientSecretFileContent});
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({caFileContent});
  };

  render() {
    const { name, mappingMethod, clientID, clientSecretFileContent, preferredUserName, claimName, claimEmail, issuer, caFileContent } = this.state;
    const title = 'Add Identity Provider: OpenID Connect';
    const mappingMethods = {
      'claim': 'Claim',
      'lookup': 'Lookup',
      'add': 'Add',
    };
    return <div className="co-m-pane__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
        <h1 className="co-m-pane__heading">{title}</h1>
        <p className="co-m-pane__explanation">
          Integrate with an OpenID Connect identity provider using an Authorization Code Flow.
        </p>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="name">Name</label>
          <input className="form-control"
            type="text"
            onChange={this.oidTextValueChanged}
            value={name}
            aria-describedby="oid-name-help"
            id="name"
            required />
          <p className="help-block" id="oid-name-help">
            Unique name of the new identity provider. This cannot be changed later.
          </p>
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="tag">Mapping Method</label>
          <Dropdown dropDownClassName="dropdown--full-width" items={mappingMethods} selectedKey={mappingMethod} title={mappingMethods[mappingMethod]} onChange={this.mappingMethodChanged} />
          <div className="help-block" id="mapping-method-description">
            { /* TODO: Add doc link when available in 4.0 docs. */ }
            Specifies how new identities are mapped to users when they log in.
          </div>
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="clientID">ClientID</label>
          <input className="form-control"
            type="text"
            onChange={this.oidTextValueChanged}
            value={clientID}
            aria-describedby="idp-clientid-help"
            id="clientID"
            required />
        </div>
        <div className="form-group">
          <DroppableFileInput
            onChange={this.clientSecretFileChanged}
            inputFileData={clientSecretFileContent}
            id="clientsecret-file"
            label="Client secret"
            isRequired
            hideContents />
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="issuer">Issuer URL</label>
          <input className="form-control"
            type="text"
            onChange={this.oidTextValueChanged}
            value={issuer}
            aria-describedby="idp-issuer-help"
            id="issuer"
            required />
        </div>
        <div className="co-form-section__separator"></div>
        <h3>Claims</h3>
        <p className="co-help-text">The first non-empty claim is used. At least one claim is required.</p>
        <div className="form-group">
          <label className="control-label" htmlFor="preferredUserName">Preferred username</label>
          <input className="form-control"
            type="text"
            onChange={this.oidTextValueChanged}
            value={preferredUserName}
            aria-describedby="idp-claimusername-help"
            id="preferredUserName" />
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="claimName">Name</label>
          <input className="form-control"
            type="text"
            onChange={this.oidTextValueChanged}
            value={claimName}
            aria-describedby="idp-claimname-help"
            id="claimName" />
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="claimEmail">Email</label>
          <input className="form-control"
            type="text"
            onChange={this.oidTextValueChanged}
            value={claimEmail}
            aria-describedby="idp-claimemail-help"
            id="claimEmail" />
        </div>
        <div className="co-form-section__separator"></div>
        <h3>More options</h3>
        <div className="form-group">
          <DroppableFileInput
            onChange={this.caFileChanged}
            inputFileData={caFileContent}
            id="caFileContent"
            label="CA"
            hideContents />
        </div>
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
  mappingMethod: 'claim' | 'lookup' | 'add';
  clientID: string;
  clientSecretFileContent: string;
  preferredUserName: string;
  claimName: string;
  claimEmail: string;
  issuer: string;
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
