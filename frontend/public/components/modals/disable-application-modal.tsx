/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';
import { ClusterServiceVersionKind, SubscriptionKind } from '../cloud-services';
import { K8sKind, K8sResourceKind } from '../../module/k8s';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';

export class DisableApplicationModal extends PromiseComponent {
  public state: DisableApplicationModalState;

  constructor(public props: DisableApplicationModalProps) {
    super(props);
    this.state.cascadeDelete = true;
  }

  private submit(event): void {
    event.preventDefault();

    const {subscription, k8sKill} = this.props;
    const deleteOptions = this.state.cascadeDelete ? {kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'} : null;
    const killPromises = [k8sKill(SubscriptionModel, subscription, {}, deleteOptions)]
      .concat(_.get(this.props.subscription, 'status.installedCSV')
        ? k8sKill(ClusterServiceVersionModel, {metadata: {name: subscription.status.installedCSV, namespace: subscription.metadata.namespace}} as ClusterServiceVersionKind, {}, deleteOptions)
        : []);

    this.handlePromise(Promise.all(killPromises)).then(() => this.props.close());
  }

  render() {
    return <form onSubmit={this.submit.bind(this)} name="form" className="co-catalog-install-modal">
      <ModalTitle className="modal-header">Remove Subscription</ModalTitle>
      <ModalBody>
        <div>
          <p>
            This will completely remove the <b>{this.props.subscription.spec.name}</b> subscription and service from {this.props.subscription.metadata.namespace}.
          </p>
        </div>
        <div>
          <label className="co-delete-modal-checkbox-label">
            <input type="checkbox" checked={this.state.cascadeDelete} onChange={() => this.setState({cascadeDelete: !this.state.cascadeDelete})} />
            &nbsp;&nbsp; <strong>Completely remove application instances and resources from the selected namespace</strong>
          </label>
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel.bind(this)} submitText="Disable" />
    </form>;
  }
}

export const createDisableApplicationModal = createModalLauncher<DisableApplicationModalProps>(DisableApplicationModal);

export type DisableApplicationModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  k8sKill: (kind: K8sKind, resource: K8sResourceKind, options: any, json: any) => Promise<any>;
  subscription: SubscriptionKind;
};

export type DisableApplicationModalState = {
  inProgress: boolean;
  errorMessage: string;
  cascadeDelete: boolean;
};
