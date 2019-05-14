import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';

import { ConfigMapModel, SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import {
  ButtonBar,
  ListInput,
  PromiseComponent,
  history,
} from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export class AddLDAPPage extends PromiseComponent<{}, AddLDAPPageState> {
  readonly state: AddLDAPPageState = {
    name: 'ldap',
    url: '',
    bindDN: '',
    bindPassword: '',
    attributesID: ['dn'],
    attributesPreferredUsername: ['uid'],
    attributesName: ['cn'],
    attributesEmail: [],
    caFileContent: '',
    inProgress: false,
    errorMessage: '',
  }

  getOAuthResource(): Promise<OAuthKind> {
    return this.handlePromise(getOAuthResource());
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
        generateName: 'ldap-ca-',
        namespace: 'openshift-config',
      },
      stringData: {
        'ca.crt': caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  createBindPasswordSecret(): Promise<K8sResourceKind> {
    const { bindPassword } = this.state;
    if (!bindPassword) {
      return Promise.resolve(null);
    }

    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'ldap-bind-password-',
        namespace: 'openshift-config',
      },
      stringData: {
        bindPassword,
      },
    };

    return this.handlePromise(k8sCreate(SecretModel, secret));
  }

  addLDAPIDP(oauth: OAuthKind, bindPasswordSecretName: string, caConfigMapName: string): Promise<K8sResourceKind> {
    const { name, url, bindDN, attributesID, attributesPreferredUsername, attributesName, attributesEmail } = this.state;
    const idp: IdentityProvider = {
      name,
      mappingMethod: 'claim',
      type: 'LDAP',
      ldap: {
        url,
        insecure: false,
        attributes: {
          id: attributesID,
          preferredUsername: attributesPreferredUsername,
          name: attributesName,
          email: attributesEmail,
        },
      },
    };

    if (bindDN) {
      idp.ldap.bindDN = bindDN;
    }

    if (bindPasswordSecretName) {
      idp.ldap.bindPassword = {
        name: bindPasswordSecretName,
      };
    }

    if (caConfigMapName) {
      idp.ldap.ca = {
        name: caConfigMapName,
      };
    }

    return this.handlePromise(addIDP(oauth, idp));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Clear any previous errors.
    this.setState({errorMessage: ''});
    this.getOAuthResource().then((oauth: OAuthKind) => {
      const promises = [
        this.createBindPasswordSecret(),
        this.createCAConfigMap(),
      ];

      Promise.all(promises).then(([bindPasswordSecret, caConfigMap]) => {
        const bindPasswordSecretName = _.get(bindPasswordSecret, 'metadata.name');
        const caConfigMapName = _.get(caConfigMap, 'metadata.name');
        return this.addLDAPIDP(oauth, bindPasswordSecretName, caConfigMapName);
      }).then(redirectToOAuthPage);
    });
  }

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({name: event.currentTarget.value});
  };

  urlChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({url: event.currentTarget.value});
  };

  bindDNChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({bindDN: event.currentTarget.value});
  };

  bindPasswordChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({bindPassword: event.currentTarget.value});
  };

  attributesIDChanged = (attributesID: string[]) => {
    this.setState({attributesID});
  };

  attributesPreferredUsernameChanged = (attributesPreferredUsername: string[]) => {
    this.setState({attributesPreferredUsername});
  };

  attributesNameChanged = (attributesName: string[]) => {
    this.setState({attributesName});
  };

  attributesEmailChanged = (attributesEmail: string[]) => {
    this.setState({attributesEmail});
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({caFileContent});
  };

  render() {
    const { name, url, bindDN, bindPassword, attributesID, attributesPreferredUsername, attributesName, caFileContent } = this.state;
    const title = 'Add Identity Provider: LDAP';
    return <div className="co-m-pane__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
        <h1 className="co-m-pane__heading">{title}</h1>
        <p className="co-m-pane__explanation">
          Integrate with an LDAP identity provider.
        </p>
        <IDPNameInput value={name} onChange={this.nameChanged} />
        <div className="form-group">
          <label className="control-label co-required" htmlFor="url">URL</label>
          <input className="form-control"
            type="text"
            onChange={this.urlChanged}
            value={url}
            id="url"
            required
            aria-describedby="url-help" />
          <div className="help-block" id="url-help">
            An RFC 2255 URL which specifies the LDAP search parameters to use.
          </div>
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="bind-dn">Bind DN</label>
          <input className="form-control"
            type="text"
            onChange={this.bindDNChanged}
            value={bindDN}
            id="bind-dn"
            aria-describedby="bind-dn-help" />
          <div className="help-block" id="bind-dn-help">
            DN to bind with during the search phase.
          </div>
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="bind-password">Bind Password</label>
          <input className="form-control"
            type="password"
            onChange={this.bindPasswordChanged}
            value={bindPassword}
            id="bind-password"
            aria-describedby="bind-password-help" />
          <div className="help-block" id="bind-password-help">
            Password to bind with during the search phase.
          </div>
        </div>
        <div className="co-form-section__separator"></div>
        <h3>Attributes</h3>
        <p className="co-help-text">Attributes map LDAP attributes to identities.</p>
        <ListInput label="ID" required initialValues={attributesID} onChange={this.attributesIDChanged} />
        <ListInput label="Preferred Username" initialValues={attributesPreferredUsername} onChange={this.attributesPreferredUsernameChanged} />
        <ListInput label="Name" initialValues={attributesName} onChange={this.attributesNameChanged} />
        <ListInput label="Email" onChange={this.attributesEmailChanged} />
        <div className="co-form-section__separator"></div>
        <h3>More Options</h3>
        <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} />
        <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
          <button type="submit" className="btn btn-primary">Add</button>
          <button type="button" className="btn btn-default" onClick={history.goBack}>Cancel</button>
        </ButtonBar>
      </form>
    </div>;
  }
}

type AddLDAPPageState = {
  name: string;
  url: string;
  bindDN: string;
  bindPassword: string;
  attributesID: string[];
  attributesPreferredUsername: string[];
  attributesName: string[];
  attributesEmail: string[];
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
