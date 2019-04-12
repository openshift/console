/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, history, resourceListPathFromModel } from '../utils';
import { ClusterServiceVersionKind, SubscriptionKind } from '../operator-lifecycle-manager';
import { K8sKind, K8sResourceKind } from '../../module/k8s';
import { ClusterServiceVersionModel, SubscriptionModel, CatalogSourceConfigModel } from '../../models';

export class DisableApplicationModal extends PromiseComponent {
  public state: DisableApplicationModalState;

  constructor(public props: DisableApplicationModalProps) {
    super(props);
    this.state.deleteCSV = true;
  }

  private submit(event): void {
    event.preventDefault();

    const {subscription, k8sKill, k8sGet, k8sPatch} = this.props;
    const {labels = {}} = subscription.metadata;
    const deleteOptions = {kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'};
    const promises = [k8sKill(SubscriptionModel, subscription, {}, deleteOptions)]
      .concat(_.get(this.props.subscription, 'status.installedCSV') && this.state.deleteCSV
        ? k8sKill(ClusterServiceVersionModel, {metadata: {name: subscription.status.installedCSV, namespace: subscription.metadata.namespace}} as ClusterServiceVersionKind, {}, deleteOptions).catch(() => Promise.resolve())
        : [])
      .concat(_.keys(labels).includes('csc-owner-name')
        ? k8sGet(CatalogSourceConfigModel, labels['csc-owner-name'], labels['csc-owner-namespace']).then((csc: K8sResourceKind) => {
          const packages = csc.spec.packages.split(',').filter(pkg => pkg !== subscription.spec.name).join(',');
          return packages.length === 0
            ? k8sKill(CatalogSourceConfigModel, csc, {}, {})
            : k8sPatch(CatalogSourceConfigModel, csc, [{op: 'replace', path: '/spec/packages', value: packages}]);
        })
        : []);

    this.handlePromise(Promise.all(promises)).then(() => {
      this.props.close();
      history.push(resourceListPathFromModel(SubscriptionModel, subscription.metadata.namespace));
    });
  }

  render() {
    const {name} = this.props.subscription.spec;

    return <form onSubmit={this.submit.bind(this)} name="form" className="modal-content co-catalog-install-modal">
      <ModalTitle className="modal-header">Remove Operator Subscription</ModalTitle>
      <ModalBody>
        <div>
          <p>
            This will remove the <b>{name}</b> subscription from <i>{this.props.subscription.metadata.namespace}</i> and the Operator will no longer receive updates.
          </p>
        </div>
        <div>
          <label className="co-delete-modal-checkbox-label">
            <input type="checkbox" checked={this.state.deleteCSV} onChange={() => this.setState({deleteCSV: !this.state.deleteCSV})} />
            &nbsp;&nbsp; <strong>Also completely remove the <b>{name}</b> Operator from the selected namespace.</strong>
          </label>
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel.bind(this)} submitText="Remove" />
    </form>;
  }
}

export const createDisableApplicationModal = createModalLauncher<DisableApplicationModalProps>(DisableApplicationModal);

export type DisableApplicationModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  k8sKill: (kind: K8sKind, resource: K8sResourceKind, options: any, json: any) => Promise<any>;
  k8sGet: (kind: K8sKind, name: string, namespace: string) => Promise<K8sResourceKind>;
  k8sPatch: (kind: K8sKind, resource: K8sResourceKind, data: {op: string, path: string, value: any}[]) => Promise<any>;
  subscription: SubscriptionKind;
};

export type DisableApplicationModalState = {
  inProgress: boolean;
  errorMessage: string;
  deleteCSV: boolean;
};
