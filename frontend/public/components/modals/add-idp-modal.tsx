/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { AsyncComponent, ExternalLink, helpLink, HELP_TOPICS, history, PromiseComponent, resourceObjPath } from '../utils';
import { OAuthModel, SecretModel } from '../../models';
import { k8sCreate, k8sGet, k8sPatch, K8sResourceKind, referenceFor } from '../../module/k8s';

// The name of the cluster-scoped OAuth configuration resource.
const oauthResourceName = 'cluster';

const DroppableFileInput = (props) => <AsyncComponent loader={() => import('../utils/file-input').then(c => c.DroppableFileInput)} {...props} />;

class AddIDPModal extends PromiseComponent {
  readonly state: AddIDPModalState = {
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
    const htpasswd = {
      name: 'htpasswd',
      type: 'HTPasswd',
      challenge: true,
      login: true,
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

  submit = (e) => {
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
          this.props.close();
          history.push(resourceObjPath(oauth, referenceFor(oauth)));
        });
    });
  }

  cancel = () => {
    this.props.close();
  }

  htpasswdFileChanged = (htpasswdFileContent: string) => {
    this.setState({htpasswdFileContent});
  }

  render() {
    const { htpasswdFileContent } = this.state;
    return <form onSubmit={this.submit} name="form">
      <ModalTitle>Add Identity Provider</ModalTitle>
      <ModalBody>
        <p>
          Identity providers determine how users log into the cluster.
          &nbsp;
          <ExternalLink href={helpLink(HELP_TOPICS.CONFIGURING_AUTHENTICATION)} text="Learn More" />
        </p>
        <div className="form-group">
          <label>Type</label>
          <p className="form-control-static">HTPasswd</p>
        </div>
        <div className="form-group">
          <DroppableFileInput
            onChange={this.htpasswdFileChanged}
            inputFileData={htpasswdFileContent}
            id="htpasswd-file"
            label="HTPasswd File"
            inputFieldHelpText="Upload an HTPasswd file created using the htpasswd command. This is a flat file that contains each user's username and encrypted password."
            isRequired
            hideContents />
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Add" cancel={this.cancel} />
    </form>;
  }
}

export const addIDPModal = createModalLauncher(AddIDPModal);

type AddIDPModalState = {
  htpasswdFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
