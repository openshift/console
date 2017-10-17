/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { List, ListHeader, ColHead, ResourceRow } from '../factory';
import { PromiseComponent, LabelList, ResourceLink } from '../utils';
import { k8sKinds } from '../../module/k8s';
import { AppTypeKind, AppTypeLogo, CatalogEntryKind } from '../cloud-services';

export const SelectNamespaceHeader = (props: SelectNamespaceHeaderProps) => <ListHeader>
  <ColHead {...props} className="col-xs-5" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-4">Labels</ColHead>
  <ColHead {...props} className="col-xs-3">Status</ColHead>
</ListHeader>;

export const SelectNamespaceRow = (props: SelectNamespaceRowProps) => {
  const {obj, onSelect, onDeselect, selected} = props;

  return <ResourceRow obj={obj}>
    <div className="col-xs-5">
      <input
        type="checkbox"
        value={obj.metadata.name}
        checked={selected}
        onChange={() => selected ? onDeselect({namespace: obj.metadata.name}) : onSelect({namespace: obj.metadata.name})}
      />
      <ResourceLink kind="Namespace" name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.uid} />
    </div>
    <div className="col-xs-4">
      <LabelList kind="Namespace" labels={obj.metadata.labels} />
    </div>
    <div className="col-xs-3">
      { selected ? <span>To be installed</span> : <span className="text-muted">Not installed</span> }
    </div>
  </ResourceRow>;
};

export class InstallApplicationModal extends PromiseComponent {
  public state: InstallApplicationModalState;

  constructor(public props: InstallApplicationModalProps) {
    super(props);
    this.state.selectedNamespaces = [];
  }

  private submit(event): void {
    event.preventDefault();

    this.handlePromise(Promise.all(this.state.selectedNamespaces
      .map((namespace) => ({
        apiVersion: 'app.coreos.com/v1alpha1',
        kind: 'InstallPlan-v1',
        metadata: {
          generateName: `${this.props.catalogEntry.metadata.name}-`,
          namespace,
        },
        spec: {
          clusterServiceVersionNames: [this.props.catalogEntry.metadata.name],
        },
      }))
      .map(installPlan => this.props.k8sCreate(k8sKinds['InstallPlan-v1'], installPlan))))
      .then(() => this.props.close());
  }

  render() {
    const {data, loaded, loadError} = this.props.namespaces;
    const {spec} = this.props.catalogEntry;
    const {clusterServiceVersions} = this.props;
    const {selectedNamespaces} = this.state;

    return <form onSubmit={this.submit.bind(this)} name="form">
      <ModalTitle>
        <AppTypeLogo displayName={spec.displayName} provider={spec.provider} icon={spec.icon[0]} />
      </ModalTitle>
      <ModalBody>
        <div>
          <p className="modal-body__field">Select the namespaces where you want to install and run the application.</p>
          <List
            loaded={loaded}
            loadError={loadError}
            data={_.values(data).filter(ns => clusterServiceVersions.find(csv => csv.metadata.namespace === ns.metadata.name) === undefined)}
            Header={SelectNamespaceHeader}
            Row={(props) => <SelectNamespaceRow
              obj={props.obj}
              selected={selectedNamespaces.find(ns => ns === props.obj.metadata.name) !== undefined}
              onSelect={(e) => this.setState({selectedNamespaces: selectedNamespaces.concat([e.namespace])})}
              onDeselect={(e) => this.setState({selectedNamespaces: selectedNamespaces.filter((ns) => ns !== e.namespace)})} />}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel.bind(this)} submitText="Save Changes" />
    </form>;
  }
}

export const createInstallApplicationModal = createModalLauncher(InstallApplicationModal);

export type InstallApplicationModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  watchK8sList: (id: string, query: any, kind: any) => void;
  k8sCreate: (kind, data) => Promise<any>;
  namespaces: {data: {[name: string]: any}, loaded: boolean, loadError: Object | string};
  clusterServiceVersions: AppTypeKind[];
  catalogEntry: CatalogEntryKind;
};

export type InstallApplicationModalState = {
  selectedNamespaces: string[];
  inProgress: boolean;
  errorMessage: string;
};

export type SelectNamespaceHeaderProps = {

};

export type SelectNamespaceRowProps = {
  obj: any;
  selected: boolean;
  onDeselect: (e: {namespace: string}) => void;
  onSelect: (e: {namespace: string}) => void;
};
