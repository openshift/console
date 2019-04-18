/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Helmet } from 'react-helmet';

import { SecretModel } from '../../models';
import {
  IdentityProvider,
  k8sCreate,
  K8sResourceKind,
  MappingMethodType,
  OAuthKind,
} from '../../module/k8s';
import {
  AsyncComponent,
  ButtonBar,
  PromiseComponent,
  history,
} from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage } from './';
import { IDPNameInput } from './idp-name-input';
import { MappingMethod } from './mapping-method';

const DroppableFileInput = (props: any) => <AsyncComponent loader={() => import('../utils/file-input').then(c => c.DroppableFileInput)} {...props} />;

export class AddHTPasswdPage extends PromiseComponent<{}, AddHTPasswdPageState> {
  readonly state: AddHTPasswdPageState = {
    name: 'htpasswd',
    mappingMethod: 'claim',
    htpasswdFileContent: '',
    inProgress: false,
    errorMessage: '',
  }

  getOAuthResource(): Promise<OAuthKind> {
    return this.handlePromise(getOAuthResource());
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

  addHTPasswdIDP(oauth: OAuthKind, secretName: string): Promise<K8sResourceKind> {
    const { name, mappingMethod } = this.state;
    const idp: IdentityProvider = {
      name,
      type: 'HTPasswd',
      mappingMethod,
      htpasswd: {
        fileData: {
          name: secretName,
        },
      },
    };

    return this.handlePromise(addIDP(oauth, idp));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!this.state.htpasswdFileContent) {
      this.setState({errorMessage: 'You must specify an HTPasswd file.'});
      return;
    }

    // Clear any previous errors.
    this.setState({errorMessage: ''});
    this.getOAuthResource().then((oauth: OAuthKind) => {
      return this.createHTPasswdSecret()
        .then((secret: K8sResourceKind) => this.addHTPasswdIDP(oauth, secret.metadata.name))
        .then(redirectToOAuthPage);
    });
  }

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (e) => {
    this.setState({name: e.currentTarget.value});
  };

  mappingMethodChanged = (mappingMethod: MappingMethodType) => {
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
        <IDPNameInput value={name} onChange={this.nameChanged} />
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
