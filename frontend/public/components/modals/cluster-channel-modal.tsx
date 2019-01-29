/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter, ModalComponentProps } from '../factory/modal';
import { Dropdown, PromiseComponent } from '../utils';
import { k8sPatch, K8sResourceKind } from '../../module/k8s';
import { ClusterVersionModel } from '../../models';
import { getAvailableClusterChannels } from '../cluster-settings/cluster-settings';

class ClusterChannelModal extends PromiseComponent {
  readonly state: ClusterChannelModalState;

  constructor(public props: ClusterChannelModalProps) {
    super(props);
  }

  _submit = (e) => {
    e.preventDefault();
    const {cv} = this.props;
    const {selectedChannel} = this.state;
    const patch = [{ op: 'add', path: '/spec/channel', value: selectedChannel }];
    this.handlePromise(k8sPatch(ClusterVersionModel, cv, patch)).then(this.props.close);
  }

  _cancel = () => {
    this.props.close();
  }

  _change = (selectedChannel) => {
    this.setState({selectedChannel});
  }

  render() {
    const {cv} = this.props;
    const availableChannels = getAvailableClusterChannels();
    return <form onSubmit={this._submit} name="form" className="modal-content modal-content--small">
      <ModalTitle>Update Channel</ModalTitle>
      <ModalBody>
        {/* <p>
          // TODO: Determine what content goes here.
        </p> */}
        <div className="form-group">
          <label htmlFor="channel_dropdown">Channel</label>
          <Dropdown
            className="cluster-channel-modal__dropdown"
            id="channel_dropdown"
            items={availableChannels}
            onChange={this._change}
            selectedKey={cv.spec.channel}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Update" cancel={this._cancel} />
    </form>;
  }
}

export const clusterChannelModal = createModalLauncher(ClusterChannelModal);

type ClusterChannelModalProps = {
  cv: K8sResourceKind;
} & ModalComponentProps;

type ClusterChannelModalState = {
  selectedChannel: string;
  inProgress: boolean;
  errorMessage: string;
};
