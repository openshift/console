/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { List, ListHeader, ColHead, ResourceRow } from '../factory';
import { PromiseComponent, ResourceIcon } from '../utils';
import { SubscriptionKind, ClusterServiceVersionLogo, CatalogEntryKind, isEnabled } from '../cloud-services';
import { SubscriptionModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';

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
        {selected ? <span>Will be enabled</span> : <span className="text-muted">Not enabled</span>}
      </div>
    </ResourceRow>
  </div>;
};

export class EnableApplicationModal extends PromiseComponent {
  public state: EnableApplicationModalState;

  constructor(public props: EnableApplicationModalProps) {
    super(props);
    this.state.selectedNamespaces = props.preSelected || [];
  }

  private submit(event): void {
    event.preventDefault();

    this.handlePromise(Promise.all(this.state.selectedNamespaces
      .map((namespace) => ({
        apiVersion: 'app.coreos.com/v1alpha1',
        kind: SubscriptionModel.kind,
        metadata: {
          generateName: `${this.props.catalogEntry.metadata.name}-`,
          namespace,
        },
        spec: {
          source: 'tectonic-ocs',
          name: this.props.catalogEntry.spec.manifest.packageName,
          channel: this.props.catalogEntry.spec.manifest.defaultChannel || this.props.catalogEntry.spec.manifest.channels[0].name,
          currentCSV: this.props.catalogEntry.spec.manifest.channels[0].currentCSV,
        },
      }))
      .map(subscription => this.props.k8sCreate(SubscriptionModel, subscription))))
      .then(() => this.props.close());
  }

  render() {
    const {data, loaded, loadError} = this.props.namespaces;
    const {spec} = this.props.catalogEntry;
    const csvSpec = spec.spec;
    const {selectedNamespaces} = this.state;

    return <form onSubmit={this.submit.bind(this)} name="form" className="co-catalog-install-modal">
      <ModalTitle className="modal-header co-m-nav-title__detail co-catalog-install-modal__header">
        <ClusterServiceVersionLogo displayName={csvSpec.displayName} provider={csvSpec.provider} icon={csvSpec.icon[0]} />
      </ModalTitle>
      <ModalBody>
        <h4 className="co-catalog-install-modal__h4">Enable Application</h4>
        <div>
          <p className="co-catalog-install-modal__description modal-body__field">Select the deployable namespaces where you want to make the application available.</p>
          <List
            loaded={loaded}
            loadError={loadError}
            data={_.values(data)
              .filter(ns => this.props.subscriptions.find(sub => sub.metadata.namespace === ns.metadata.name) === undefined)
              .filter(ns => isEnabled(ns))}
            Header={SelectNamespaceHeader}
            Row={(props) => <SelectNamespaceRow
              obj={props.obj}
              selected={selectedNamespaces.find(ns => ns === props.obj.metadata.name) !== undefined}
              onSelect={(e) => this.setState({selectedNamespaces: selectedNamespaces.concat([e.namespace])})}
              onDeselect={(e) => this.setState({selectedNamespaces: selectedNamespaces.filter((ns) => ns !== e.namespace)})} />}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel.bind(this)} submitText="Enable" submitDisabled={selectedNamespaces.length === 0}/>
    </form>;
  }
}

export const createEnableApplicationModal: (props: ModalProps) => {result: Promise<void>} = createModalLauncher(EnableApplicationModal);

export type EnableApplicationModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  k8sCreate: (kind, data) => Promise<any>;
  namespaces: {data: {[name: string]: any}, loaded: boolean, loadError: Object | string};
  preSelected?: string[];
  subscriptions: SubscriptionKind[];
  catalogEntry: CatalogEntryKind;
};

export type EnableApplicationModalState = {
  selectedNamespaces: string[];
  inProgress: boolean;
  errorMessage: string;
};

export type SelectNamespaceHeaderProps = {

};

export type SelectNamespaceRowProps = {
  obj: K8sResourceKind;
  selected: boolean;
  onDeselect: (e: {namespace: string}) => void;
  onSelect: (e: {namespace: string}) => void;
};

type ModalProps = Omit<EnableApplicationModalProps, 'cancel' | 'close'>;

SelectNamespaceHeader.displayName = 'SelectNamespaceHeader';
SelectNamespaceRow.displayName = 'SelectNamespaceRow';
