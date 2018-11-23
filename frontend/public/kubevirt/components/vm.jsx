import * as _ from 'lodash-es';
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';

import { ResourceEventStream } from './okdcomponents';
import { ListHeader, ColHead, List, ListPage, ResourceRow, DetailsPage } from './factory/okdfactory';
import { breadcrumbsForOwnerRefs, Firehose, ResourceLink, navFactory, ResourceKebab, Kebab, units } from './utils/okdutils';
import {
  VirtualMachineInstanceModel,
  VirtualMachineModel,
  PodModel,
  NamespaceModel,
  TemplateModel,
  NetworkAttachmentDefinitionModel,
  StorageClassModel,
  PersistentVolumeClaimModel,
  VirtualMachineInstanceMigrationModel,
} from '../models';
import { k8sCreate, actions } from '../module/okdk8s';

import { startStopVmModal } from './modals/start-stop-vm-modal';
import { restartVmModal } from './modals/restart-vm-modal';
import {
  getResourceKind,
  getLabelMatcher,
  findVMI,
  findPod,
  findVMIMigration,
  getFlattenForKind,
} from './utils/resources';

import {
  CreateVmWizard,
  BasicMigrationDialog,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_OS_LABEL,
  VmStatus,
  getVmStatus,
  VM_STATUS_ALL,
  VM_STATUS_TO_TEXT,
} from 'kubevirt-web-ui-components';

import VmConsolesConnected from './vmconsoles';
import { Nic } from './nic';
import { Disk } from './disk';
import { DASHES, IMPORTER_DV_POD_PREFIX, VIRT_LAUNCHER_POD_PREFIX } from './utils/constants';
import { resourceLauncher } from './utils/resourceLauncher';
import { showError } from './utils/showErrors';

const VMHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 hidden-xs" sortField="spec.running">State</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Virtual Machine Instance</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Pod</ColHead>
</ListHeader>;

const getAction = (vm) => {
  return _.get(vm, 'spec.running', false) ? 'Stop Virtual Machine' : 'Start Virtual Machine';
};

const menuActionStart = (kind, vm) => ({
  label: getAction(vm),
  callback: () => startStopVmModal({
    kind: kind,
    resource: vm,
    start: !_.get(vm, 'spec.running', false),
  }),
});

const menuActionRestart = (kind, vm) => ({
  hidden: !_.get(vm, 'spec.running', false),
  label: 'Restart Virtual Machine',
  callback: () => restartVmModal({
    kind: kind,
    resource: vm,
  }),
});

const menuActionMigrate = (kind, vm) => ({
  hidden: !_.get(vm, 'spec.running', false),
  label: 'Migrate Virtual Machine',
  callback: () => {
    return resourceLauncher(BasicMigrationDialog, {
      virtualMachineInstance: {
        resource: getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, false, getLabelMatcher(vm)),
        required: true,
      },
    })({
      k8sCreate,
      onMigrationError: showError,
    });
  },
});

const menuActions = [menuActionStart, menuActionRestart, menuActionMigrate, Kebab.factory.Delete];

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

const StateColumn = props => {
  if (props.loaded){
    const vm = props.flatten(props.resources);
    if (vm) {
      return <VmStatus vm={vm} launcherPod={getPod(vm, props.resources, VIRT_LAUNCHER_POD_PREFIX)} importerPod={getPod(vm, props.resources, IMPORTER_DV_POD_PREFIX)} migration={getMigration(vm, props.resources)} />;
    }
  }
  return DASHES;
};

const FirehoseResourceLink = props => {
  if (props.loaded) {
    const data = props.flatten(props.resources);
    if (data) {
      let resource = data[0];
      if (props.filter) {
        resource = props.filter(data);
      }
      if (resource) {
        const name = resource.metadata.name;
        const namespace = resource.metadata.namespace;
        const title = resource.metadata.uid;
        const kind = resource.kind || PodModel.kind;
        return <ResourceLink kind={kind} name={name} namespace={namespace} title={title} />;
      }
    }
  }
  return DASHES;
};

export const VMRow = ({obj: vm}) => {
  const vmResource = getResourceKind(VirtualMachineModel, vm.metadata.name, true, vm.metadata.namespace, false);
  const vmiResources = getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, true, getLabelMatcher(vm));
  const podResources = getResourceKind(PodModel, undefined, true, vm.metadata.namespace, true, getLabelMatcher(vm));
  const migrationResources = getResourceKind(VirtualMachineInstanceMigrationModel, undefined, true, vm.metadata.namespace, false); // https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancemigration

  return <ResourceRow obj={vm}>
    <div className="col-lg-2 col-md-2 col-sm-2 col-xs-6">
      <ResourceLink kind={VirtualMachineModel.kind} name={vm.metadata.name} namespace={vm.metadata.namespace} title={vm.metadata.uid} />
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 col-xs-6 co-break-word">
      <ResourceLink kind={NamespaceModel.kind} name={vm.metadata.namespace} title={vm.metadata.namespace} />
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={[vmResource, podResources, migrationResources]} flatten={getFlattenForKind(VirtualMachineModel.kind)}>
        <StateColumn />
      </Firehose>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={[vmiResources]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
        <FirehoseResourceLink filter={data => findVMI(data, vm.metadata.name)} />
      </Firehose>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={[podResources]} flatten={getFlattenForKind(PodModel.kind)}>
        <FirehoseResourceLink filter={data => findPod(data, vm.metadata.name)} />
      </Firehose>
    </div>
    <div className="co-kebab-wrapper">
      <ResourceKebab actions={menuActions} kind={VirtualMachineModel.kind} resource={vm} />
    </div>
  </ResourceRow>;
};

const VMStatus = (props) => {
  const vmResource = getResourceKind(VirtualMachineModel, props.vm.metadata.name, true, props.vm.metadata.namespace, false);
  const vmiResources = getResourceKind(VirtualMachineInstanceModel, props.vm.metadata.name, true, props.vm.metadata.namespace, true, getLabelMatcher(props.vm));
  const podResources = getResourceKind(PodModel, undefined, true, props.vm.metadata.namespace, true, getLabelMatcher(props.vm));

  return <div className="row">
    <div className="col-lg-12">
      <h3 className="overview-section-title">Status</h3>
      <dl className="dl-horizontal dl-left">
        <dt>Name:</dt>
        <dd>{props.vm.metadata.name}</dd>
        <dt>State:</dt>
        <dd>
          <Firehose resources={[vmResource]} flatten={getFlattenForKind(VirtualMachineModel.kind)}>
            <StateColumn />
          </Firehose>
        </dd>
        <dt>VM Instance:</dt>
        <dd>
          <Firehose resources={[vmiResources]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
            <FirehoseResourceLink filter={data => findVMI(data, props.vm.metadata.name)} />
          </Firehose>
        </dd>
        <dt>Pod:</dt>
        <dd>
          <Firehose resources={[podResources]} flatten={getFlattenForKind(PodModel.kind)}>
            <FirehoseResourceLink filter={data => findPod(data, props.vm.metadata.name)} />
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
    const data = this.props.flatten(this.props.resources);
    const vmi = this.props.filter(data);
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
  const vmiResources = getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, true, getLabelMatcher(vm));
  return <Fragment>
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading">Virtual Machine Overview</h1>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-lg-6">
            <VMStatus vm={vm} />
          </div>
          <div className="col-lg-6">
            <Firehose resources={[vmiResources]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
              <VMResourceConfiguration vm={vm} filter={data => findVMI(data, vm.metadata.name)} />
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
    />);
};

const mapStateToProps = ({k8s}) => ({
  k8s,
});

const mapDispatchToProps = () => ({
  stopK8sWatch: actions.stopK8sWatch,
  watchK8sList: actions.watchK8sList,
});

const openNewVmWizard = activeNamespace => {
  const launcher = resourceLauncher(CreateVmWizard, {
    namespaces: {
      resource: getResourceKind(NamespaceModel, undefined, true, undefined, true),
    },
    templates: {
      resource: getResourceKind(TemplateModel, undefined, true, undefined, true, undefined, [{key: TEMPLATE_TYPE_LABEL, operator: 'Exists' }]),
    },
    networkConfigs: {
      resource: getResourceKind(NetworkAttachmentDefinitionModel, undefined, true, undefined, true),
    },
    storageClasses: {
      resource: { kind:StorageClassModel.kind, isList: true, prop: StorageClassModel.kind},
    },
    persistentVolumeClaims: {
      resource: { kind:PersistentVolumeClaimModel.kind, isList: true, prop: PersistentVolumeClaimModel.kind},
    },
  },(({namespaces}) => {
      let selectedNamespace;

      if (namespaces && activeNamespace){
        selectedNamespace = namespaces.find(namespace => namespace.metadata.name === activeNamespace);
      }

      return {
        selectedNamespace,
      };
    }));

  launcher({
    k8sCreate,
    units,
  });

};

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
            return () => openNewVmWizard(this.props.namespace);
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
