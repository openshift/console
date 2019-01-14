import React from 'react';
import {
  VmDetails,
  CDI_KUBEVIRT_IO,
} from 'kubevirt-web-ui-components';


import { k8sPatch, k8sGet } from '../../module/okdk8s';
import { ResourceEventStream } from '../okdcomponents';
import { DetailsPage } from '../factory/okdfactory';
import { breadcrumbsForOwnerRefs, ResourceLink, navFactory } from '../utils/okdutils';
import { WithResources } from '../utils/withResources';
import {
  VirtualMachineInstanceModel,
  PodModel,
  NamespaceModel,
  VirtualMachineInstanceMigrationModel,
} from '../../models/index';
import {
  getResourceKind,
  getLabelMatcher,
  findPod,
  findImporterPods,
  findVMIMigration,
} from '../utils/resources';
import { DASHES, VIRT_LAUNCHER_POD_PREFIX } from '../utils/constants';
import VmConsolesConnected from '../vmconsoles';
import { Nic } from '../nic';
import { Disk } from '../disk';
import { NodeLink, LoadingInline } from '../../../components/utils';
import { menuActions } from './menu-actions';

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

const ConnectedVmDetails = ({ obj: vm }) => {
  const resourceMap = {
    vmi: {
      resource: getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, false),
      ignoreErrors: true,
    },
    pods: {
      resource: getResourceKind(PodModel, undefined, true, vm.metadata.namespace, true, getLabelMatcher(vm)),
    },
    importerPods: {
      resource: getResourceKind(PodModel, undefined, true, vm.metadata.namespace, true, {[CDI_KUBEVIRT_IO]: 'importer'}),
    },
    migrations: {
      resource: getResourceKind(VirtualMachineInstanceMigrationModel, undefined, true, vm.metadata.namespace, false),
    },
  };

  return (
    <WithResources resourceMap={resourceMap}>
      <VmDetails_ vm={vm} />
    </WithResources>
  );
};

const VmDetails_ = props => {
  const { vm, pods, importerPods, migrations, vmi } = props;

  const vmPod = findPod(pods, vm.metadata.name, VIRT_LAUNCHER_POD_PREFIX);

  const migration = vmi ? findVMIMigration(migrations, vmi.metadata.name) : null;

  const namespaceResourceLink = () =>
    <ResourceLink kind={NamespaceModel.kind} name={vm.metadata.namespace} title={vm.metadata.namespace} />;

  const podResourceLink = () =>
    vmPod ? <ResourceLink
      kind={PodModel.kind}
      name={vmPod.metadata.name}
      namespace={vmPod.metadata.namespace}
      uid={vmPod.metadata.uid}
    />
      : DASHES;

  return (
    <VmDetails
      {...props}
      vm={vm}
      ResourceLink={ResourceLink}
      NodeLink={NodeLink}
      NamespaceResourceLink={namespaceResourceLink}
      PodResourceLink={podResourceLink}
      launcherPod={findPod(pods, vm.metadata.name, VIRT_LAUNCHER_POD_PREFIX)}
      importerPods={findImporterPods(importerPods, vm)}
      migration={migration}
      pods={pods}
      vmi={vmi}
      k8sPatch={k8sPatch}
      k8sGet={k8sGet}
      LoadingComponent={LoadingInline}
    />);
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
    navFactory.details(ConnectedVmDetails),
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
