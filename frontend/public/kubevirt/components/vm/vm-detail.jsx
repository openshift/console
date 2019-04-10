import React from 'react';
import * as _ from 'lodash-es';
import {
  VmDetails,
  getName,
  getNamespace,
  getResource,
  VIRT_LAUNCHER_POD_PREFIX,
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
  ServiceModel,
} from '../../models/index';

import { DASHES } from '../utils/constants';
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

export const ConnectedVmDetails = ({ obj: vm, ...rest }) => {
  const { name, namespace } = vm.metadata;
  const resourceMap = {
    vmi: {
      resource: getResource(VirtualMachineInstanceModel, {name, namespace, isList: false}),
      ignoreErrors: true,
    },
    pods: {
      resource: getResource(PodModel, { namespace }),
    },
    migrations: {
      resource: getResource(VirtualMachineInstanceMigrationModel, {namespace}),
    },
    services: {
      resource: getResource(ServiceModel, {namespace}),
    },
  };

  return (
    <WithResources resourceMap={resourceMap}>
      <VmDetails_ vm={vm} {...rest} ResourceLinkComponent={ResourceLink} />
    </WithResources>
  );
};

const VmDetails_ = props => {
  const { vm, pods, migrations, vmi } = props;

  const namespaceResourceLink = () =>
    <ResourceLink kind={NamespaceModel.kind} name={getNamespace(vm)} title={getNamespace(vm)} />;

  const podResourceLink = ({pod}) =>
    pod ? <ResourceLink
      kind={PodModel.kind}
      name={getName(pod)}
      namespace={getNamespace(pod)}
      uid={pod.metadata.uid}
    />
      : DASHES;

  return (
    <VmDetails
      {...props}
      vm={vm}
      NodeLink={NodeLink}
      NamespaceResourceLink={namespaceResourceLink}
      PodResourceLink={podResourceLink}
      migrations={migrations}
      pods={pods}
      vmi={vmi}
      k8sPatch={k8sPatch}
      k8sGet={k8sGet}
      LoadingComponent={LoadingInline}
    />);
};

const VmDisk = ({obj: vm}) => <Disk vm={vm} />;

const VmNic = ({obj: vm}) => <Nic vm={vm} />;

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
    component: VmNic,
  };

  const disksPage = {
    href: 'disks',
    name: 'Disks',
    component: VmDisk,
  };

  const pages = [
    navFactory.details(p => <div className="co-m-pane__body"><ConnectedVmDetails {...p} /></div>),
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
        getResource(PodModel, { namespace }),
      ]}
    />);
};
