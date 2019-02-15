/* eslint-disable no-undef, no-unused-vars */

import * as _ from 'lodash-es';
import * as React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter, ModalComponentProps } from '../factory/modal';
import { Dropdown, PromiseComponent, ExternalLink } from '../utils';
import { ClusterVersionKind, k8sPatch } from '../../module/k8s';
import { ClusterVersionModel } from '../../models';
import { getAvailableClusterUpdates, getDesiredClusterVersion } from '../cluster-settings/cluster-settings';

class ClusterUpdateModal extends PromiseComponent {
  readonly state: ClusterUpdateModalState;

  constructor(public props: ClusterUpdateModalProps) {
    super(props);
    this.state.selectedVersion = 0;
  }

  _submit = (e) => {
    e.preventDefault();
    const {cv} = this.props;
    const {selectedVersion} = this.state;
    const desiredUpdate = getAvailableClusterUpdates(cv)[selectedVersion];
    const patch = [{ op: 'add', path: '/spec/desiredUpdate', value: desiredUpdate }];
    this.handlePromise(k8sPatch(ClusterVersionModel, cv, patch)).then(this.props.close);
  }

  _cancel = () => {
    this.props.close();
  }

  _change = (selectedVersion) => {
    this.setState({selectedVersion});
  }

  render() {
    const {cv} = this.props;
    const availableUpdates = getAvailableClusterUpdates(cv);
    const currentVersion = getDesiredClusterVersion(cv);
    const dropdownItems = _.map(availableUpdates, 'version');
    return <form onSubmit={this._submit} name="form" className="modal-content">
      <ModalTitle>Update Cluster</ModalTitle>
      <ModalBody>
        <p>
          For more detailed documentation on specific versions, &nbsp;
          <ExternalLink href="https://github.com/openshift/origin/releases" text="view release notes." />
        </p>
        <div className="form-group">
          <label>Current Version</label>
          <p>{currentVersion}</p>
        </div>
        <div className="form-group">
          <label htmlFor="version_dropdown">New Version</label>
          <Dropdown
            className="cluster-update-modal__dropdown"
            id="version_dropdown"
            items={dropdownItems}
            onChange={this._change}
            title="Select Version"
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Update" cancel={this._cancel} />
    </form>;
  }
}

export const clusterUpdateModal = createModalLauncher(ClusterUpdateModal);

type ClusterUpdateModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps;

type ClusterUpdateModalState = {
  selectedVersion: number;
  inProgress: boolean;
  errorMessage: string;
};
