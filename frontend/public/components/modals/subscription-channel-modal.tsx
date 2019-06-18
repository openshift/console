import * as React from 'react';
import * as _ from 'lodash';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, ResourceLink } from '../utils';
import { K8sKind, K8sResourceKind, referenceForModel } from '../../module/k8s';
import { SubscriptionKind, PackageManifestKind } from '../operator-lifecycle-manager/index';
import { SubscriptionModel, ClusterServiceVersionModel } from '../../models';
import { RadioInput } from '../radio';

export class SubscriptionChannelModal extends PromiseComponent<SubscriptionChannelModalProps, SubscriptionChannelModalState> {
  public state: SubscriptionChannelModalState;

  constructor(public props: SubscriptionChannelModalProps) {
    super(props);

    this.state.selectedChannel = props.subscription.spec.channel || props.pkg.status.channels[0].name;
  }

  private submit(event): void {
    event.preventDefault();

    const updatedSub = _.cloneDeep(this.props.subscription);
    updatedSub.spec.channel = this.state.selectedChannel;
    this.handlePromise(this.props.k8sUpdate(SubscriptionModel, updatedSub)).then(() => this.props.close());
  }

  render() {
    return <form onSubmit={this.submit.bind(this)} name="form" className="modal-content">
      <ModalTitle className="modal-header">Change Subscription Update Channel</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>Which channel is used to receive updates?</p>
        </div>
        <div className="co-m-form-row row">
          { this.props.pkg.status.channels.map((channel, i) => <div key={i} className="col-sm-12">
            <RadioInput
              onChange={(e) => this.setState({selectedChannel: e.target.value})}
              value={channel.name}
              checked={this.state.selectedChannel === channel.name}
              title={channel.name}
              subTitle={<ResourceLink linkTo={false} name={channel.currentCSV} title={channel.currentCSV} kind={referenceForModel(ClusterServiceVersionModel)} />} />
          </div>) }
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel.bind(this)} submitText="Save" />
    </form>;
  }
}

export const createSubscriptionChannelModal = createModalLauncher<SubscriptionChannelModalProps>(SubscriptionChannelModal);

export type SubscriptionChannelModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  k8sUpdate: (kind: K8sKind, newObj: K8sResourceKind) => Promise<any>;
  subscription: SubscriptionKind;
  pkg: PackageManifestKind;
};

export type SubscriptionChannelModalState = {
  inProgress: boolean;
  errorMessage: string;
  selectedChannel: string;
};
