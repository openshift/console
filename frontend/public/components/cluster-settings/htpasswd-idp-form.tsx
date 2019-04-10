/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';

import { OAuthModel, SecretModel } from '../../models';
import { k8sCreate, k8sGet, k8sPatch, K8sResourceKind, referenceFor } from '../../module/k8s';
import {
  AsyncComponent,
  ButtonBar,
  PromiseComponent,
  history,
  resourceObjPath,
} from '../utils';
import { MappingMethod, MappingMethodType } from './mapping-method';

// The name of the cluster-scoped OAuth configuration resource.
const oauthResourceName = 'cluster';

const DroppableFileInput = (props) => <AsyncComponent loader={() => import('../utils/file-input').then(c => c.DroppableFileInput)} {...props} />;

export class AddHTPasswdPage extends PromiseComponent {
  readonly state: AddHTPasswdPageState = {
    name: 'htpasswd',
    mappingMethod: 'claim',
    htpasswdFileContent: '',
    inProgress: false,
    errorMessage: '',
  }

  getOAuthResource(): Promise<K8sResourceKind> {
    return this.handlePromise(k8sGet(OAuthModel, oauthResourceName));
  }

  createHTPasswdSecret(): Promise<K8sResourceKind> {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'htpasswd-',
        namespace: 'openshift-config',
      },
      stringData: {
        htpasswd: this.state.htpasswdFileContent,
      },
    };

    return this.handlePromise(k8sCreate(SecretModel, secret));
  }

  addHTPasswdIDP(oauth: K8sResourceKind, secretName: string): Promise<K8sResourceKind> {
    const { name, mappingMethod } = this.state;
    const htpasswd = {
      name,
      type: 'HTPasswd',
      mappingMethod,
      htpasswd: {
        fileData: {
          name: secretName,
        },
      },
    };

    const patch = _.isEmpty(oauth.spec.identityProviders)
      ? { op: 'add', path: '/spec/identityProviders', value: [htpasswd] }
      : { op: 'add', path: '/spec/identityProviders/-', value: htpasswd };
    return this.handlePromise(k8sPatch(OAuthModel, oauth, [patch]));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!this.state.htpasswdFileContent) {
      this.setState({errorMessage: 'You must specify an HTPasswd file.'});
      return;
    }

    // Clear any previous errors.
    this.setState({errorMessage: ''});
    this.getOAuthResource().then((oauth: K8sResourceKind) => {
      return this.createHTPasswdSecret()
        .then((secret: K8sResourceKind) => this.addHTPasswdIDP(oauth, secret.metadata.name))
        .then(() => {
          history.push(resourceObjPath(oauth, referenceFor(oauth)));
        });
    });
  }

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (e) => {
    this.setState({name: e.currentTarget.value});
  };

  mappingMethodChanged = (mappingMethod: string) => {
    this.setState({mappingMethod});
  }

  htpasswdFileChanged = (htpasswdFileContent: string) => {
    this.setState({htpasswdFileContent});
  };

  render() {
    const { name, mappingMethod, htpasswdFileContent } = this.state;
    const title = 'Add Identity Provider: HTPasswd';

    return <div className="co-m-pane__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
        <h1 className="co-m-pane__heading">{title}</h1>
        <p className="co-m-pane__explanation">
          HTPasswd validates usernames and passwords against a flat file generated using the htpasswd command.
        </p>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="idp-name">Name</label>
          <input className="form-control"
            type="text"
            onChange={this.nameChanged}
            value={name}
            aria-describedby="idp-name-help"
            id="idp-name"
            required />
          <p className="help-block" id="idp-name-help">
            Unique name of the new identity provider. This cannot be changed later.
          </p>
        </div>
        <MappingMethod value={mappingMethod} onChange={this.mappingMethodChanged} />
        <div className="form-group">
          <DroppableFileInput
            onChange={this.htpasswdFileChanged}
            inputFileData={htpasswdFileContent}
            id="htpasswd-file"
            label="HTPasswd File"
            inputFieldHelpText="Upload an HTPasswd file created using the htpasswd command."
            isRequired
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

type AddHTPasswdPageState = {
  name: string;
  mappingMethod: MappingMethodType;
  htpasswdFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
