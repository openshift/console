/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { ListHeader, ColHead, List, ListPage, ResourceRow } from '../../../components/factory';
import { ResourceLink, ResourceKebab, Kebab } from '../../../components/utils';
import { VirtualMachineModel, NamespaceModel } from '../../../models';
import { referenceForModel } from '../../../module/k8s';

import { startStopVMModal } from './modals';
import { getVMStatus } from '../module/k8s/vms';
import * as s from '../strings';

const VMHeader = (props) => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs" sortField="spec.running">State</ColHead>
</ListHeader>;

const getAction = (vm) => {
  return _.get(vm, 'spec.running', false) ? 'Stop Virtual Machine' : 'Start Virtual Machine';
};

const menuActionStart = (kind, vm) => ({
  label: getAction(vm),
  callback: () => startStopVMModal({
    kind,
    resource: vm,
    start: !_.get(vm, 'spec.running', false),
  }),
});

export const menuActions = [menuActionStart, Kebab.factory.Edit, Kebab.factory.Delete];

export const StateColumn = ({ vm }) => {
  const value = getVMStatus(vm);
  return value && <span>{value}</span> || <span className="text-muted">{s.notAvailable}</span>;
};

export const PhaseColumn = (props) => {
  const { loaded, loadError, flatten, filter, resources } = props;
  let value;
  if (loaded && !loadError) {
    const vmi = filter(flatten(resources));
    value = _.get(vmi, 'status.phase');
  }
  return value || <span className="text-muted">{s.notAvailable}</span>;
};

const VMRow = ({ obj: vm }) => {
  return <ResourceRow obj={vm}>
    <div className="col-sm-4 col-xs-6">
      <ResourceLink
        kind={referenceForModel(VirtualMachineModel)}
        name={vm.metadata.name}
        namespace={vm.metadata.namespace}
        title={vm.metadata.uid} />
    </div>
    <div className="col-sm-4 col-xs-6 co-break-word">
      <ResourceLink
        kind={NamespaceModel.kind}
        name={vm.metadata.namespace}
        title={vm.metadata.namespace} />
    </div>
    <div className="col-sm-4 hidden-xs">
      <StateColumn vm={vm} />
    </div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab
        kind={referenceForModel(VirtualMachineModel)}
        resource={vm}
        actions={menuActions} />
    </div>
  </ResourceRow>;
};

const VMList = (props) => <List {...props} Header={VMHeader} Row={VMRow} />;

const filters = [{
  type: 'vm-status',
  selected: ['Running', 'Stopped'],
  reducer: getVMStatus,
  items: [
    { id: 'Running', title: 'Running' },
    { id: 'Stopped', title: 'Stopped' },
  ],
}];

export const VirtualMachinesPage: React.SFC<{}> = (props) => (
  <ListPage
    {...props}
    kind={referenceForModel(VirtualMachineModel)}
    ListComponent={VMList}
    canCreate={true}
    rowFilters={filters}
  />
);
