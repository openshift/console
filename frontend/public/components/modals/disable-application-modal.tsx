/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { List, ListHeader, ColHead, ResourceRow } from '../factory';
import { PromiseComponent, ResourceIcon } from '../utils';
import { ClusterServiceVersionKind, ClusterServiceVersionLogo, CatalogEntryKind, isEnabled, SubscriptionKind } from '../cloud-services';
import { K8sKind, K8sResourceKind } from '../../module/k8s';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';

export const SelectNamespaceHeader: React.SFC<SelectNamespaceHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-xs-9" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3">Status</ColHead>
</ListHeader>;

export const SelectNamespaceRow: React.SFC<SelectNamespaceRowProps> = (props) => {
  const {obj, onSelect, onDeselect, selected} = props;
  const toggle = () => selected ? onDeselect({namespace: obj.metadata.name}) : onSelect({namespace: obj.metadata.name});

  return <div className="co-catalog-install__row" onClick={toggle}>
    <ResourceRow obj={obj}>
      <div className="col-xs-9">
        <input
          type="checkbox"
          value={obj.metadata.name}
          checked={selected}
          onChange={toggle}
          style={{marginRight: '4px'}}
        />
        <ResourceIcon kind="Namespace" />
        <span>{obj.metadata.name}</span>
      </div>
      <div className="col-xs-3">
        {selected ? <span>To be disabled</span> : <span className="text-muted">Enabled</span>}
      </div>
    </ResourceRow>
  </div>;
};

export class DisableApplicationModal extends PromiseComponent {
  public state: DisableApplicationModalState;

  constructor(public props: DisableApplicationModalProps) {
    super(props);
    this.state.selectedNamespaces = [];
    this.state.cascadeDelete = true;
  }

  private submit(event): void {
    event.preventDefault();

    const deleteOptions = this.state.cascadeDelete ? {kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'} : null;
    const clusterServiceVersions = this.props.clusterServiceVersions.filter(csv => this.state.selectedNamespaces.indexOf(csv.metadata.namespace) > -1)
      .map(csv => this.props.k8sKill(ClusterServiceVersionModel, csv, {}, deleteOptions));
    const subscriptions = this.props.subscriptions.filter(sub => this.state.selectedNamespaces.indexOf(sub.metadata.namespace) > -1)
      .map(sub => this.props.k8sKill(SubscriptionModel, sub, {}, deleteOptions));

    this.handlePromise(Promise.all(clusterServiceVersions.concat(subscriptions))).then(() => this.props.close());
  }

  render() {
    const {data, loaded, loadError} = this.props.namespaces;
    const {spec} = this.props.catalogEntry;
    const csvSpec = spec.spec;
    const {clusterServiceVersions} = this.props;
    const {selectedNamespaces} = this.state;

    return <form onSubmit={this.submit.bind(this)} name="form" className="co-catalog-install-modal">
      <ModalTitle className="modal-header co-m-nav-title__detail co-catalog-install-modal__header">
        <ClusterServiceVersionLogo displayName={csvSpec.displayName} provider={csvSpec.provider} icon={csvSpec.icon[0]} />
      </ModalTitle>
      <ModalBody>
        <h4 className="co-catalog-install-modal__h4">Disable Service</h4>
        <div>
          <p className="co-catalog-install-modal__description modal-body__field">Select the namespaces where you want to disable the service.</p>
          <List
            loaded={loaded}
            loadError={loadError}
            data={_.values(data)
              .filter(ns => clusterServiceVersions.find(csv => csv.metadata.namespace === ns.metadata.name) !== undefined)
              .filter(ns => isEnabled(ns))}
            Header={SelectNamespaceHeader}
            Row={(props) => <SelectNamespaceRow
              obj={props.obj}
              selected={selectedNamespaces.find(ns => ns === props.obj.metadata.name) !== undefined}
              onSelect={(e) => this.setState({selectedNamespaces: selectedNamespaces.concat([e.namespace])})}
              onDeselect={(e) => this.setState({selectedNamespaces: selectedNamespaces.filter((ns) => ns !== e.namespace)})} />}
          />
        </div>
        <div style={{padding: '20px 0'}}>
          <label className="co-delete-modal-checkbox-label">
            <input type="checkbox" checked={this.state.cascadeDelete} onChange={() => this.setState({cascadeDelete: !this.state.cascadeDelete})} />
            &nbsp;&nbsp; <strong>Completely remove application instances and resources from every selected namespace</strong>
          </label>
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel.bind(this)} submitText="Disable" submitDisabled={selectedNamespaces.length === 0}/>
    </form>;
  }
}

export const createDisableApplicationModal: (props: ModalProps) => {result: Promise<void>} = createModalLauncher(DisableApplicationModal);

export type DisableApplicationModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  k8sKill: (kind: K8sKind, resource: K8sResourceKind, options: any, json: any) => Promise<any>;
  namespaces: {data: {[name: string]: any}, loaded: boolean, loadError: Object | string};
  clusterServiceVersions: ClusterServiceVersionKind[];
  subscriptions: SubscriptionKind[];
  catalogEntry: CatalogEntryKind;
};

export type DisableApplicationModalState = {
  selectedNamespaces: string[];
  inProgress: boolean;
  errorMessage: string;
  cascadeDelete: boolean;
};

export type SelectNamespaceHeaderProps = {

};

export type SelectNamespaceRowProps = {
  obj: any;
  selected: boolean;
  onDeselect: (e: {namespace: string}) => void;
  onSelect: (e: {namespace: string}) => void;
};

type ModalProps = Omit<DisableApplicationModalProps, 'cancel' | 'close'>;

SelectNamespaceHeader.displayName = 'SelectNamespaceHeader';
SelectNamespaceRow.displayName = 'SelectNamespaceRow';
