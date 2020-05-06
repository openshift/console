import * as React from 'react';
import * as _ from 'lodash';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { PromiseComponent, ResourceLink } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { RadioInput } from '@console/internal/components/radio';
import { SubscriptionKind, PackageManifestKind } from '../../types';
import { SubscriptionModel, ClusterServiceVersionModel } from '../../models';

const getSelectedChannel = (props: SubscriptionChannelModalProps) =>
  props.subscription.spec.channel || props.pkg.status.channels[0].name;

export class SubscriptionChannelModal extends PromiseComponent<
  SubscriptionChannelModalProps,
  SubscriptionChannelModalState
> {
  public state: SubscriptionChannelModalState;

  constructor(public props: SubscriptionChannelModalProps) {
    super(props);

    this.state.selectedChannel = getSelectedChannel(props);
  }

  private submit(event): void {
    event.preventDefault();

    const updatedSub = _.cloneDeep(this.props.subscription);
    updatedSub.spec.channel = this.state.selectedChannel;
    this.handlePromise(this.props.k8sUpdate(SubscriptionModel, updatedSub))
      .then(() => this.props.close())
      .catch((err) => this.setState({ errorMessage: err }));
  }

  render() {
    return (
      <form onSubmit={this.submit.bind(this)} name="form" className="modal-content">
        <ModalTitle className="modal-header">Change Subscription Update Channel</ModalTitle>
        <ModalBody>
          <div className="co-m-form-row">
            <p>Which channel is used to receive updates?</p>
          </div>
          <div className="co-m-form-row row">
            {this.props.pkg.status.channels.map((channel) => (
              <div key={channel.name} className="col-sm-12">
                <RadioInput
                  onChange={(e) => this.setState({ selectedChannel: e.target.value })}
                  value={channel.name}
                  checked={this.state.selectedChannel === channel.name}
                  title={channel.name}
                  subTitle={
                    <ResourceLink
                      linkTo={false}
                      name={channel.currentCSV}
                      title={channel.currentCSV}
                      kind={referenceForModel(ClusterServiceVersionModel)}
                    />
                  }
                />
              </div>
            ))}
          </div>
        </ModalBody>
        <ModalSubmitFooter
          inProgress={this.state.inProgress}
          errorMessage={this.state.errorMessage}
          cancel={() => this.props.cancel()}
          submitText="Save"
          submitDisabled={this.state.selectedChannel === getSelectedChannel(this.props)}
        />
      </form>
    );
  }
}

export const createSubscriptionChannelModal = createModalLauncher<SubscriptionChannelModalProps>(
  SubscriptionChannelModal,
);

export type SubscriptionChannelModalProps = {
  cancel?: () => void;
  close?: () => void;
  k8sUpdate: (kind: K8sKind, newObj: K8sResourceKind) => Promise<any>;
  subscription: SubscriptionKind;
  pkg: PackageManifestKind;
};

export type SubscriptionChannelModalState = {
  inProgress: boolean;
  errorMessage: string;
  selectedChannel: string;
};
