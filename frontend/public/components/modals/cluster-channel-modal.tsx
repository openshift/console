import * as React from 'react';
import * as _ from 'lodash-es';

import { ChannelDocLink } from '../cluster-settings/cluster-settings';
import { ClusterVersionModel } from '../../models';
import { Dropdown, PromiseComponent } from '../utils';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory/modal';
import { getAvailableClusterChannels, k8sPatch, K8sResourceKind } from '../../module/k8s';

class ClusterChannelModal extends PromiseComponent<
  ClusterChannelModalProps,
  ClusterChannelModalState
> {
  readonly state: ClusterChannelModalState;

  constructor(public props: ClusterChannelModalProps) {
    super(props);
    this.state.selectedChannel = _.get(props.cv, 'spec.channel');
  }

  _submit = (e) => {
    e.preventDefault();
    const { cv } = this.props;
    const { selectedChannel } = this.state;
    const patch = [{ op: 'add', path: '/spec/channel', value: selectedChannel }];
    this.handlePromise(k8sPatch(ClusterVersionModel, cv, patch)).then(this.props.close);
  };

  _cancel = () => {
    this.props.close();
  };

  _change = (selectedChannel) => {
    this.setState({ selectedChannel });
  };

  render() {
    const { cv } = this.props;
    const availableChannels = getAvailableClusterChannels();
    return (
      <form
        onSubmit={this._submit}
        name="form"
        className="modal-content modal-content--no-inner-scroll"
      >
        <ModalTitle>Update Channel</ModalTitle>
        <ModalBody>
          <p>
            Select a channel that reflects your desired version. Critical security updates will be
            delivered to any vulnerable channels.
          </p>
          <p>
            <ChannelDocLink />
          </p>
          <div className="form-group">
            <label htmlFor="channel_dropdown">Select Channel</label>
            <Dropdown
              className="cluster-channel-modal__dropdown"
              id="channel_dropdown"
              items={availableChannels}
              onChange={this._change}
              selectedKey={cv.spec.channel}
              title="Select Channel"
            />
          </div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText="Save"
          cancel={this._cancel}
        />
      </form>
    );
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
