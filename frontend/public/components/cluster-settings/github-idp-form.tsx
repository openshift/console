import * as React from 'react';
import { Helmet } from 'react-helmet';

import { SecretModel, ConfigMapModel } from '../../models';
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


export class AddGitHubPage extends PromiseComponent<{}, AddGitHubPageState> {
  readonly state: AddGitHubPageState = {
    name: 'github',
    clientID: '',
    clientSecret: '',
    hostname: '',
    organizations: [],
    teams: [],
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
        generateName: 'github-client-secret-',
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
        generateName: 'github-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  addGitHubIDP(oauth: OAuthKind, clientSecretName: string, caName: string): Promise<K8sResourceKind> {
    const { name, clientID, hostname, organizations, teams } = this.state;
    const idp: IdentityProvider = {
      name,
      type: 'GitHub',
      mappingMethod: 'claim',
      github: {
        clientID,
        clientSecret: {
          name: clientSecretName,
        },
        hostname,
        organizations,
        teams,
      },
    };

    if (caName) {
      idp.github.ca = {
        name: caName,
      };
    }

    return this.handlePromise(addIDP(oauth, idp));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (this.state.organizations.length > 0 && this.state.teams.length > 0) {
      this.setState({errorMessage: 'Specify either organizations or teams, but not both.'});
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
        return this.addGitHubIDP(oauth, secret.metadata.name, caName);
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

  hostnameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({hostname: event.currentTarget.value});
  };

  organizationsChanged = (organizations: string[]) => {
    this.setState({organizations});
  };

  teamsChanged = (teams: string[]) => {
    this.setState({teams});
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({caFileContent});
  };

  render() {
    const { name, clientID, clientSecret, hostname, caFileContent } = this.state;
    const title = 'Add Identity Provider: GitHub';
    return <div className="co-m-pane__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
        <h1 className="co-m-pane__heading">{title}</h1>
        <p className="co-m-pane__explanation">
          You can use the GitHub integration to connect to either GitHub or GitHub Enterprise. For GitHub Enterprise, you must provide the hostname of your instance and can optionally provide a CA certificate bundle to use in requests to the server.
        </p>
        <IDPNameInput value={name} onChange={this.nameChanged} />
        <div className="form-group">
          <label className="control-label co-required" htmlFor="client-id">Client ID</label>
          <input className="pf-c-form-control"
            type="text"
            onChange={this.clientIDChanged}
            value={clientID}
            id="client-id"
            required />
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="client-secret">Client Secret</label>
          <input className="pf-c-form-control"
            type="password"
            onChange={this.clientSecretChanged}
            value={clientSecret}
            id="client-secret"
            required />
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="hostname">Hostname</label>
          <input className="pf-c-form-control"
            type="text"
            onChange={this.hostnameChanged}
            value={hostname}
            id="hostname"
            aria-describedby="idp-hostname-help" />
          <p className="help-block" id="idp-hostname-help">
            Optional domain for use with a hosted instance of GitHub Enterprise.
          </p>
        </div>
        <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} />
        <div className="co-form-section__separator"></div>
        <h3>Organizations</h3>
        <p className="co-help-text">Optionally list organizations. If specified, only GitHub users that are members of at least one of the listed organizations will be allowed to log in. Cannot be used in combination with <strong>teams</strong>.</p>
        <ListInput label="Organization" onChange={this.organizationsChanged} helpText="Restricts which organizations are allowed to log in." />
        <div className="co-form-section__separator"></div>
        <h3>Teams</h3>
        <p className="co-help-text">Optionally list teams. If specified, only GitHub users that are members of at least one of the listed teams will be allowed to log in. Cannot be used in combination with <strong>organizations</strong>.</p>
        <ListInput label="Team" onChange={this.teamsChanged} helpText="Restricts which teams are allowed to log in. The format is <org>/<team>." />
        <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
          <button type="submit" className="btn btn-primary">Add</button>
          <button type="button" className="btn btn-default" onClick={history.goBack}>Cancel</button>
        </ButtonBar>
      </form>
    </div>;
  }
}

type AddGitHubPageState = {
  name: string;
  clientID: string;
  clientSecret: string;
  hostname: string
  organizations: string[];
  teams: string[];
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
