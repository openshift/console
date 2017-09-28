/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { List, ListHeader, ColHead, ResourceRow } from '../factory';
import { PromiseComponent, LabelList, ResourceLink } from '../utils';
import { k8sKinds } from '../../module/k8s';
import { AppTypeKind } from '../cloud-services';

export const SelectNamespaceHeader = (props: SelectNamespaceHeaderProps) => <ListHeader>
  <ColHead {...props} className="col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-6">Labels</ColHead>
</ListHeader>;

export const SelectNamespaceRow = (props: SelectNamespaceRowProps) => {
  const {obj, onSelect, onDeselect, preSelected, selected} = props;

  return <ResourceRow obj={obj}>
    <div className="col-xs-6">
      {/* TODO(alecmerdler): Determine how to 'uninstall' apps from a namespace */}
      { preSelected && <i style={{color: '#2fc98e'}} className="fa fa-check" /> }
      { !preSelected && <input 
        type="checkbox" 
        value={obj.metadata.name} 
        checked={selected || preSelected} 
        disabled={preSelected}
        onChange={() => selected ? onDeselect({namespace: obj.metadata.name}) : onSelect({namespace: obj.metadata.name})} 
      /> }
      <ResourceLink kind="Namespace" name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.uid} />
    </div>
    <div className="col-xs-6">
      <LabelList kind="Namespace" labels={obj.metadata.labels} />
    </div>
  </ResourceRow>;
};

export class InstallApplicationModal extends PromiseComponent {
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
          name: this.props.clusterServiceVersion,
          namespace,
        },
        spec: {
          clusterServiceVersions: [this.props.clusterServiceVersion],
        },
      }))
      .map(installPlan => this.props.k8sCreate(k8sKinds['InstallPlan-v1'], installPlan))))
      .then(() => this.props.close());
  }

  render() {
    const {data, loaded, loadError} = this.props.namespaces;

    return <form onSubmit={this.submit.bind(this)} name="form">
      <ModalTitle>Application Namespaces</ModalTitle>
      <ModalBody>
        <div>
          <p className="modal-body__field">Select the namespaces where you want to install and run the application.</p>
          <List 
            loaded={loaded} 
            loadError={loadError} 
            data={_.values(data)} 
            Header={SelectNamespaceHeader}
            Row={(props) => <SelectNamespaceRow 
              obj={props.obj}
              selected={this.state.selectedNamespaces.find(ns => ns === props.obj.metadata.name) !== undefined}
              preSelected={this.props.clusterServiceVersions.find(ns => ns.metadata.namespace === props.obj.metadata.name) !== undefined}
              onSelect={(e) => this.setState({selectedNamespaces: this.state.selectedNamespaces.concat([e.namespace])})} 
              onDeselect={(e) => this.setState({selectedNamespaces: this.state.selectedNamespaces.filter(({metadata}) => metadata.name !== e.namespace)})} />} 
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
  clusterServiceVersion: string;
};

export type SelectNamespaceHeaderProps = {

};

export type SelectNamespaceRowProps = {
  obj: any;
  selected: boolean;
  preSelected: boolean;
  onDeselect: (e: {namespace: string}) => void;
  onSelect: (e: {namespace: string}) => void;
};
