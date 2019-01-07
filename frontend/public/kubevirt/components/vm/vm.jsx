import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  VmStatus,
  getVmStatus,
  VM_STATUS_ALL,
  VM_STATUS_TO_TEXT,
} from 'kubevirt-web-ui-components';

import { ListHeader, ColHead, List, ListPage, ResourceRow } from '../factory/okdfactory';
import { Firehose, ResourceLink, ResourceKebab } from '../utils/okdutils';
import { actions } from '../../module/okdk8s';
import {
  VirtualMachineInstanceModel,
  VirtualMachineModel,
  PodModel,
  NamespaceModel,
  VirtualMachineInstanceMigrationModel,
} from '../../models/index';
import {
  getResourceKind,
  getLabelMatcher,
  findVmPod,
  findVmMigration,
} from '../utils/resources';
import { DASHES, IMPORTER_DV_POD_PREFIX, VIRT_LAUNCHER_POD_PREFIX } from '../utils/constants';
import { openCreateVmWizard } from '../modals/create-vm-modal';
import { menuActions } from './menu-actions';

const mainRowSize = 'col-lg-4 col-md-4 col-sm-6 col-xs-6';
const otherRowSize = 'col-lg-4 col-md-4 hidden-sm hidden-xs';

const VMHeader = props => <ListHeader>
  <ColHead {...props} className={mainRowSize} sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className={otherRowSize} sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className={mainRowSize} sortField="spec.running">State</ColHead>
</ListHeader>;

const StateColumn = ({ loaded, vm, resources }) => {
  return loaded
    ? <VmStatus
      vm={vm}
      launcherPod={findVmPod(vm, resources, VIRT_LAUNCHER_POD_PREFIX)}
      importerPod={findVmPod(vm, resources, IMPORTER_DV_POD_PREFIX)}
      migration={findVmMigration(vm, resources)}
    />
    : DASHES;
};

export const VMRow = ({obj: vm}) => {
  const podResources = getResourceKind(PodModel, undefined, true, vm.metadata.namespace, true, getLabelMatcher(vm));
  const migrationResources = getResourceKind(VirtualMachineInstanceMigrationModel, undefined, true, vm.metadata.namespace, false);

  return <ResourceRow obj={vm}>
    <div className={mainRowSize}>
      <ResourceLink kind={VirtualMachineModel.kind} name={vm.metadata.name} namespace={vm.metadata.namespace} title={vm.metadata.uid} />
    </div>
    <div className={otherRowSize}>
      <ResourceLink kind={NamespaceModel.kind} name={vm.metadata.namespace} title={vm.metadata.namespace} />
    </div>
    <div className={mainRowSize}>
      <Firehose resources={[podResources, migrationResources]}>
        <StateColumn vm={vm} />
      </Firehose>
    </div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions}
        kind={VirtualMachineModel.kind}
        resource={vm}
        resources={[
          getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, false),
          getResourceKind(VirtualMachineInstanceMigrationModel, undefined, true, vm.metadata.namespace, false),
        ]} />
    </div>
  </ResourceRow>;
};

export const VMList = (props) => <List {...props} Header={VMHeader} Row={VMRow} />;

const mapStateToProps = ({k8s}) => ({
  k8s,
});

const mapDispatchToProps = () => ({
  stopK8sWatch: actions.stopK8sWatch,
  watchK8sList: actions.watchK8sList,
});

const filters = [{
  type: 'vm-status',
  selected: VM_STATUS_ALL,
  reducer: getVmStatus,
  items: VM_STATUS_ALL.map(status => ({ id: status, title: VM_STATUS_TO_TEXT[status] }) ),
}];

export const VirtualMachinesPage = connect(
  mapStateToProps, mapDispatchToProps)(class VirtualMachinesPage extends Component {

  constructor(props){
    super(props);

    const createItems = {
      wizard: 'Create with Wizard',
      yaml: 'Create from YAML',
    };

    this.createProps = {
      items: createItems,
      createLink: (type) => {
        switch (type) {
          case 'wizard':
            return () => openCreateVmWizard(this.props.namespace);
          default:
            return `/k8s/ns/${this.props.namespace || 'default'}/virtualmachines/new/`;
        }
      },
    };
  }

  render() {
    return <React.Fragment>
      <ListPage
        {...this.props}
        canCreate={true}
        kind={VirtualMachineModel.kind}
        ListComponent={VMList}
        createProps={this.createProps}
        rowFilters={filters}
      />
    </React.Fragment>;
  }
});
