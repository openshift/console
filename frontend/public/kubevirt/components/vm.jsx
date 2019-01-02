import * as _ from 'lodash-es';
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';

import { ResourceEventStream } from './okdcomponents';
import { ListHeader, ColHead, List, ListPage, ResourceRow, DetailsPage } from './factory/okdfactory';
import { breadcrumbsForOwnerRefs, Firehose, ResourceLink, navFactory, Kebab, ResourceKebab } from './utils/okdutils';
import {
  VirtualMachineInstanceModel,
  VirtualMachineModel,
  PodModel,
  NamespaceModel,
  VirtualMachineInstanceMigrationModel,
} from '../models';
import { actions, k8sCreate } from '../module/okdk8s';
import { startStopVmModal } from './modals/start-stop-vm-modal';
import { restartVmModal } from './modals/restart-vm-modal';
import { cancelVmiMigrationModal } from './modals/cancel-vmi-migration-modal';
import {
  getResourceKind,
  getLabelMatcher,
  findPod,
  findVMIMigration,
  getFlattenForKind,
} from './utils/resources';
import {
  BasicMigrationDialog,
  TEMPLATE_OS_LABEL,
  VmStatus,
  getVmStatus,
  isBeingMigrated,
  VM_STATUS_ALL,
  VM_STATUS_TO_TEXT,
} from 'kubevirt-web-ui-components';
import { DASHES, IMPORTER_DV_POD_PREFIX, VIRT_LAUNCHER_POD_PREFIX } from './utils/constants';
import { modalResourceLauncher } from './utils/modalResourceLauncher';
import { showError } from './utils/showErrors';
import VmConsolesConnected from './vmconsoles';
import { Nic } from './nic';
import { Disk } from './disk';
import { openCreateVmWizard } from './modals/create-vm-modal';

const mainRowSize = 'col-lg-3 col-md-3 col-sm-6 col-xs-6';
const otherRowSize = 'col-lg-2 col-md-2 hidden-sm hidden-xs';

const VMHeader = props => <ListHeader>
  <ColHead {...props} className={mainRowSize} sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className={otherRowSize} sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className={mainRowSize} sortField="spec.running">State</ColHead>
  <ColHead {...props} className={otherRowSize}>Virtual Machine Instance</ColHead>
  <ColHead {...props} className={otherRowSize}>Pod</ColHead>
</ListHeader>;

const getAction = (vm) => {
  return _.get(vm, 'spec.running', false) ? 'Stop Virtual Machine' : 'Start Virtual Machine';
};

const menuActionStart = (kind, vm) => ({
  label: getAction(vm),
  callback: () => startStopVmModal({
    kind,
    resource: vm,
    start: !_.get(vm, 'spec.running', false),
  }),
});

const menuActionRestart = (kind, vm) => ({
  hidden: !_.get(vm, 'spec.running', false),
  label: 'Restart Virtual Machine',
  callback: () => restartVmModal({
    kind,
    resource: vm,
  }),
});

const menuActionCancelMigration = (kind, vm, actionArgs) => {
  const migration = findVMIMigration(actionArgs[VirtualMachineInstanceMigrationModel.kind], _.get(actionArgs[VirtualMachineInstanceModel.kind], 'metadata.name'));
  return {
    hidden: !isBeingMigrated(vm, migration),
    label: 'Cancel Virtual Machine Migration',
    callback: () => cancelVmiMigrationModal({
      migration,
    }),
  };
};

const menuActionMigrate = (kind, vm, actionArgs) => {
  const migration = findVMIMigration(actionArgs[VirtualMachineInstanceMigrationModel.kind], _.get(actionArgs[VirtualMachineInstanceModel.kind], 'metadata.name'));
  return {
    hidden: !_.get(vm, 'spec.running', false) || isBeingMigrated(vm, migration),
    label: 'Migrate Virtual Machine',
    callback: () => {
      return modalResourceLauncher(BasicMigrationDialog, {
        virtualMachineInstance: {
          resource: getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, false, getLabelMatcher(vm)),
          required: true,
        },
      })({
        k8sCreate,
        onMigrationError: showError,
        virtualMachineInstance: {}, // initial - is required
      });
    },
  };
};

const menuActions = [menuActionStart, menuActionRestart, menuActionMigrate, menuActionCancelMigration, Kebab.factory.Delete];

const getPod = (vm, resources, podNamePrefix) => {
  const podFlatten = getFlattenForKind(PodModel.kind);
  const podData = podFlatten(resources);
  return findPod(podData, vm.metadata.name, podNamePrefix);
};

const getMigration = (vm, resources) => {
  const flatten = getFlattenForKind(VirtualMachineInstanceMigrationModel.kind);
  const migrationData = flatten(resources);
  return findVMIMigration(migrationData, vm.metadata.name);
};

const StateColumn = ({ loaded, vm, resources }) => {
  return loaded
    ? <VmStatus
      vm={vm}
      launcherPod={getPod(vm, resources, VIRT_LAUNCHER_POD_PREFIX)}
      importerPod={getPod(vm, resources, IMPORTER_DV_POD_PREFIX)}
      migration={getMigration(vm, resources)}
    />
    : DASHES;
};

const FirehoseResourceLink = props => {
  if (props.loaded && !props.loadError) {
    const data = props.flatten(props.resources);
    const resource = props.filter ? props.filter(data) : data;
    if (resource) {
      const { name, namespace, uid } = resource.metadata;
      const kind = resource.kind || PodModel.kind;
      return <ResourceLink kind={kind} name={name} namespace={namespace} title={uid} />;
    }
  }
  return DASHES;
};

export const VMRow = ({obj: vm}) => {
  const vmiResource = getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, false);
  const podResources = getResourceKind(PodModel, undefined, true, vm.metadata.namespace, true, getLabelMatcher(vm));
  // https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancemigration
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
    <div className={otherRowSize}>
      <Firehose resources={[vmiResource]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
        <FirehoseResourceLink />
      </Firehose>
    </div>
    <div className={otherRowSize}>
      <Firehose resources={[podResources]} flatten={getFlattenForKind(PodModel.kind)}>
        <FirehoseResourceLink filter={data => findPod(data, vm.metadata.name, VIRT_LAUNCHER_POD_PREFIX)} />
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

const VMStatus = ({ vm }) => {
  const vmiResource = getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, false);
  const podResources = getResourceKind(PodModel, undefined, true, vm.metadata.namespace, true, getLabelMatcher(vm));
  // https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancemigration
  const migrationResources = getResourceKind(VirtualMachineInstanceMigrationModel, undefined, true, vm.metadata.namespace, false);

  return <div className="row">
    <div className="col-lg-12">
      <h3 className="overview-section-title">Status</h3>
      <dl className="dl-horizontal dl-left">
        <dt>Name:</dt>
        <dd>{vm.metadata.name}</dd>
        <dt>State:</dt>
        <dd>
          <Firehose resources={[podResources, migrationResources]}>
            <StateColumn vm={vm} />
          </Firehose>
        </dd>
        <dt>VM Instance:</dt>
        <dd>
          <Firehose resources={[vmiResource]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
            <FirehoseResourceLink />
          </Firehose>
        </dd>
        <dt>Pod:</dt>
        <dd>
          <Firehose resources={[podResources]} flatten={getFlattenForKind(PodModel.kind)}>
            <FirehoseResourceLink filter={data => findPod(data, vm.metadata.name, VIRT_LAUNCHER_POD_PREFIX)} />
          </Firehose>
        </dd>
      </dl>
    </div>
  </div>;
};


class VMResourceConfiguration extends Component {

  getCpu(resource) {
    return this.getFromDomain(resource, ['cpu','cores']);
  }

  getMemory(resource) {
    return this.getFromDomain(resource, ['resources','requests','memory']);
  }

  getFromDomain(resource, path) {
    const domain = ['spec','domain'];
    if (resource.kind === VirtualMachineModel.kind) {
      domain.unshift('spec','template');
    }
    domain.push(...path);
    return _.get(resource, domain);
  }

  getVMConfiguration() {
    const configuration = {};
    const vmi = this.props.flatten(this.props.resources);
    if (vmi) {
      configuration.cpu = this.getCpu(vmi);
      configuration.memory = this.getMemory(vmi);
    } else {
      configuration.cpu = this.getCpu(this.props.vm);
      configuration.memory = this.getMemory(this.props.vm);
    }
    configuration.os = _.get(this.props.vm, ['metadata', 'annotations', TEMPLATE_OS_LABEL]);
    return configuration;
  }


  render(){
    const configuration = this.getVMConfiguration();
    return <div className="row">
      <div className="col-lg-12">
        <h3 className="overview-section-title">Configuration</h3>
        <dl className="dl-horizontal  dl-left">
          <dt>Memory:</dt>
          <dd>{configuration.memory || DASHES}</dd>
          <dt>CPU:</dt>
          <dd>{configuration.cpu || DASHES}</dd>
          <dt>Operating System:</dt>
          <dd>{configuration.os || DASHES}</dd>
        </dl>
      </div>
    </div>;
  }
}


export const VMList = (props) => <List {...props} Header={VMHeader} Row={VMRow} />;

const Details = ({obj: vm}) => {
  const vmiResource = getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, false);
  return <Fragment>
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading">Virtual Machine Overview</h1>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-lg-6">
            <VMStatus vm={vm} />
          </div>
          <div className="col-lg-6">
            <Firehose resources={[vmiResource]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
              <VMResourceConfiguration vm={vm} />
            </Firehose>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
};

const VmiEvents = ({obj: vm}) => {
  const vmi = {
    kind: VirtualMachineInstanceModel.kind,
    metadata: {
      name: vm.metadata.name,
      namespace: vm.metadata.namespace,
    },
  };
  return <ResourceEventStream obj={vmi} />;
};

export const VirtualMachinesDetailsPage = props => {
  const consolePage = { // TODO: might be moved based on review; or display conditionally if VM is running?
    href: 'consoles',
    name: 'Consoles',
    component: VmConsolesConnected,
  };

  const nicsPage = {
    href: 'nics',
    name: 'Network Interfaces',
    component: Nic,
  };

  const disksPage = {
    href: 'disks',
    name: 'Disks',
    component: Disk,
  };

  const pages = [
    navFactory.details(Details),
    navFactory.editYaml(),
    consolePage,
    navFactory.events(VmiEvents),
    nicsPage,
    disksPage,
  ];

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
        name: 'Virtual Machine Details',
        path: props.match.url,
      })}
      menuActions={menuActions}
      pages={pages}
      resources={[
        getResourceKind(VirtualMachineInstanceModel, props.name, true, props.namespace, false),
        getResourceKind(VirtualMachineInstanceMigrationModel, undefined, true, props.namespace, false),
      ]}
    />);
};

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
