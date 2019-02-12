import React from 'react';
import * as _ from 'lodash-es';
import {
  VmDetails,
  CDI_KUBEVIRT_IO,
  getName,
  getNamespace,
  getResource,
} from 'kubevirt-web-ui-components';

import { k8sPatch, k8sGet } from '../../module/okdk8s';
import { ResourcesEventStream } from '../okdcomponents';
import { DetailsPage } from '../factory/okdfactory';
import { breadcrumbsForOwnerRefs, ResourceLink, navFactory } from '../utils/okdutils';
import { WithResources } from '../utils/withResources';
import {
  VirtualMachineInstanceModel,
  PodModel,
  NamespaceModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineModel,
} from '../../models/index';
import {
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

const VmEvents = ({ obj: vm }) => {
  const vmObj = {
    name: getName(vm),
    namespace: getNamespace(vm),
  };
  const vmFilter = obj => _.isMatch(obj, {...vmObj, kind: VirtualMachineModel.kind});
  const vmiFilter = obj => _.isMatch(obj, {...vmObj, kind: VirtualMachineInstanceModel.kind});
  const launcherPodFilter = ({ kind, namespace, name }) =>
    kind === PodModel.kind && namespace === getNamespace(vm) && name.startsWith(`${VIRT_LAUNCHER_POD_PREFIX}${getName(vm)}-`);
  const importerPodFilter = ({ kind, namespace, name }) => {
    // importer pod example importer-<diskName>-<vmname>-<generatedId>
    // note: diskName and vmname may contain '-' which means pod name should have at least 4 parts
    if (kind === PodModel.kind && namespace === getNamespace(vm) && name.startsWith('importer-') && name.split('-').length > 3) {
      const importerDashIndex = name.indexOf('-');
      const diskDashIndex = name.indexOf('-', importerDashIndex + 1);
      const lastDashIndex = name.lastIndexOf('-');
      // try to remove importer- and some part of <diskname>
      const diskAndVmName = name.slice(diskDashIndex + 1, lastDashIndex);
      return diskAndVmName.endsWith(getName(vm));
    }
    return false;
  };
  const migrationsFilter = ({ kind, namespace, name }) =>
    kind === VirtualMachineInstanceMigrationModel.kind && namespace === getNamespace(vm) && name === `${getName(vm)}-migration`;
  return <ResourcesEventStream filters={[vmiFilter, vmFilter, launcherPodFilter, importerPodFilter, migrationsFilter]} namespace={getNamespace(vm)} />;
};

const ConnectedVmDetails = ({ obj: vm }) => {
  const { name, namespace } = vm.metadata;
  const resourceMap = {
    vmi: {
      resource: getResource(VirtualMachineInstanceModel, {name, namespace, isList: false}),
      ignoreErrors: true,
    },
    pods: {
      resource: getResource(PodModel, { namespace, matchExpressions: [{key: 'kubevirt.io', operator: 'Exists' }] }),
    },
    importerPods: {
      resource: getResource(PodModel, {namespace, matchLabels: {[CDI_KUBEVIRT_IO]: 'importer'}}),
    },
    migrations: {
      resource: getResource(VirtualMachineInstanceMigrationModel, {namespace}),
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

  const vmPod = findPod(pods, getName(vm), VIRT_LAUNCHER_POD_PREFIX);
  const migration = vmi ? findVMIMigration(migrations, getName(vmi)) : null;

  const namespaceResourceLink = () =>
    <ResourceLink kind={NamespaceModel.kind} name={getNamespace(vm)} title={getNamespace(vm)} />;

  const podResourceLink = () =>
    vmPod ? <ResourceLink
      kind={PodModel.kind}
      name={getName(vmPod)}
      namespace={getNamespace(vmPod)}
      uid={vmPod.metadata.uid}
    />
      : DASHES;

  return (
    <VmDetails
      {...props}
      vm={vm}
      NodeLink={NodeLink}
      NamespaceResourceLink={namespaceResourceLink}
      PodResourceLink={podResourceLink}
      launcherPod={findPod(pods, getName(vm), VIRT_LAUNCHER_POD_PREFIX)}
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
  const { name, namespace } = props;
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
    navFactory.events(VmEvents),
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
        getResource(VirtualMachineInstanceModel, {name, namespace, isList: false}),
        getResource(VirtualMachineInstanceMigrationModel, {namespace}),
      ]}
    />);
};
