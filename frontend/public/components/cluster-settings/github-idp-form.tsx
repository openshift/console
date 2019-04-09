/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Helmet } from 'react-helmet';

import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, MappingMethodType, OAuthKind } from '../../module/k8s';
import {
  AsyncComponent,
  ButtonBar,
  ListInput,
  PromiseComponent,
  history,
} from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage } from './';
import { IDPNameInput } from './idp-name-input';
import { MappingMethod } from './mapping-method';

const DroppableFileInput = (props: any) => <AsyncComponent loader={() => import('../utils/file-input').then(c => c.DroppableFileInput)} {...props} />;

export class AddGitHubPage extends PromiseComponent {
  readonly state: AddGitHubPageState = {
    name: 'github',
    mappingMethod: 'claim',
    clientID: '',
    clientSecret: '',
    hostname: '',
    organization: [],
    team: [],
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
      stringData: {
        'ca.crt': caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  addGitHubIDP(oauth: OAuthKind, clientSecretName: string, caName: string): Promise<K8sResourceKind> {
    const { name, mappingMethod, clientID, hostname, organization, team } = this.state;
    const idp: IdentityProvider = {
      name,
      type: 'GitHub',
      mappingMethod,
      github: {
        clientID,
        clientSecret: {
          name: clientSecretName,
        },
        hostname,
        organization,
        team,
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
    if (this.state.organization.length > 0 && this.state.team.length > 0) {
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

  organizationChanged = (organization: string[]) => {
    this.setState({organization});
  };

  teamChanged = (team: string[]) => {
    this.setState({team});
  };

  mappingMethodChanged = (mappingMethod: string) => {
    this.setState({mappingMethod});
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({caFileContent});
  };

  render() {
    const { name, mappingMethod, clientID, clientSecret, hostname, caFileContent } = this.state;
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
          <label className="control-label" htmlFor="hostname">Hostname</label>
          <input className="form-control"
            type="text"
            onChange={this.hostnameChanged}
            value={hostname}
            id="hostname"
            aria-describedby="idp-hostname-help" />
          <p className="help-block" id="idp-hostname-help">
            Optional domain for use with a hosted instance of GitHub Enterprise.
          </p>
        </div>
        <div className="form-group">
          <DroppableFileInput
            onChange={this.caFileChanged}
            inputFileData={caFileContent}
            id="ca-file-content"
            label="CA File"
            hideContents />
        </div>
        <div className="co-form-section__separator"></div>
        <h3>Organizations</h3>
        <p className="co-help-text">Optionally list organizations. If specified, only GitHub users that are members of at least one of the listed organizations will be allowed to log in. Cannot be used in combination with <strong>teams</strong>.</p>
        <ListInput label="Organization" onChange={this.organizationChanged} />
        <div className="co-form-section__separator"></div>
        <h3>Teams</h3>
        <p className="co-help-text">Optionally list teams. If specified, only GitHub users that are members of at least one of the listed teams will be allowed to log in. Cannot be used in combination with <strong>organizations</strong>.</p>
        <ListInput label="Team" onChange={this.teamChanged} />
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
  mappingMethod: MappingMethodType;
  clientID: string;
  clientSecret: string;
  hostname: string
  organization: string[];
  team: string[];
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
