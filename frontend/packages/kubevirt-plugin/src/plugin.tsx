import * as _ from 'lodash';
import * as React from 'react';
import { DashboardsStorageCapacityDropdownItem } from '@console/ceph-storage-plugin';
import { PersistentVolumeClaimModel, PodModel, TemplateModel } from '@console/internal/models';
import {
  DashboardsInventoryItemGroup,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewResourceActivity,
  ModelDefinition,
  Plugin,
  ProjectDashboardInventoryItem,
  ResourceDetailsPage,
  ResourceListPage,
  ResourceNSNavItem,
  RoutePage,
  YAMLTemplate,
} from '@console/plugin-sdk';
import { getName } from '@console/shared/src/selectors/common';
import { getKubevirtHealthState } from './components/dashboards-page/overview-dashboard/health';
import {
  getVMStatusGroups,
  VMOffGroupIcon,
} from './components/dashboards-page/overview-dashboard/inventory';
import { diskImportKindMapping } from './components/dashboards-page/overview-dashboard/utils';
import * as models from './models';
import { VirtualMachineYAMLTemplates, VMTemplateYAMLTemplates } from './models/templates';
import { getTopologyPlugin, TopologyConsumedExtensions } from './topology/topology-plugin';

import '@console/internal/i18n.js';
import './style.scss';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | YAMLTemplate
  | ModelDefinition
  | RoutePage
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewInventoryItem
  | DashboardsInventoryItemGroup
  | DashboardsStorageCapacityDropdownItem
  | ProjectDashboardInventoryItem
  | DashboardsOverviewResourceActivity
  | TopologyConsumedExtensions;

export const FLAG_KUBEVIRT = 'KUBEVIRT';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      id: 'virtualization',
      section: 'workloads',
      componentProps: {
        // t('kubevirt-plugin~Virtualization')
        name: '%kubevirt-plugin~Virtualization%',
        resource: 'virtualization',
      },
      insertBefore: 'deployments',
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.VirtualMachineModel,
      template: VirtualMachineYAMLTemplates.getIn(['default']),
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: TemplateModel,
      template: VMTemplateYAMLTemplates.getIn(['vm-template']),
      templateName: 'vm-template',
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/persistentvolumeclaims/~new/upload-form'],
      loader: () =>
        import(
          './components/cdi-upload-provider/upload-pvc-form/upload-pvc-form' /* webpackChunkName: "kubevirt" */
        ).then((m) => m.UploadPVCPage),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/virtualization/~new'],
      loader: () =>
        import('./components/vms/vm-create-yaml' /* webpackChunkName: "kubevirt" */).then(
          (m) => m.VMCreateYAML,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/virtualization/~new-wizard'],
      loader: () =>
        import(
          './components/create-vm-wizard' /* webpackChunkName: "kubevirt-create-vm-wizard" */
        ).then((m) => m.CreateVMWizardPage),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/virtualization/~new-from-template'],
      loader: () =>
        import(
          './components/create-vm/create-vm' /* webpackChunkName: "kubevirt-create-vm" */
        ).then((m) => m.CreateVM),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: '/k8s/ns/:ns/virtualmachines/:name',
      loader: () =>
        import('./components/vms/vm-details-page' /* webpackChunkName: "kubevirt" */).then(
          (m) => m.VirtualMachinesDetailsPage,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: '/k8s/ns/:ns/virtualmachineinstances/:name',
      loader: () =>
        import('./components/vms/vmi-details-page' /* webpackChunkName: "kubevirt" */).then(
          (m) => m.VirtualMachinesInstanceDetailsPage,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: ['/k8s/ns/:ns/virtualization', '/k8s/all-namespaces/virtualization'],
      loader: () =>
        import('./components/vms/virtualization' /* webpackChunkName: "kubevirt" */).then(
          (m) => m.VirtualizationPage,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/virtualmachines', '/k8s/all-namespaces/virtualmachines'],
      loader: () =>
        import('./components/vms/virtualization' /* webpackChunkName: "kubevirt" */).then(
          (m) => m.RedirectToVirtualizationPage,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/vmtemplates', '/k8s/all-namespaces/vmtemplates'],
      loader: () =>
        import('./components/vms/virtualization' /* webpackChunkName: "kubevirt" */).then(
          (m) => m.RedirectToVirtualizationTemplatePage,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: '/k8s/ns/:ns/vmtemplates/:name',
      loader: () =>
        import(
          './components/vm-templates/vm-template-details-page' /* webpackChunkName: "kubevirt" */
        ).then((m) => m.VMTemplateDetailsPage),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/vmtemplates', '/k8s/all-namespaces/vmtemplates'],
      loader: () =>
        import('./components/vm-templates/vm-template' /* webpackChunkName: "kubevirt" */).then(
          (m) => m.VirtualMachineTemplatesPage,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: '/k8s/ns/:ns/virtualmachinesnapshots/:name',
      loader: () =>
        import(
          './components/vm-snapshots/vm-snapshot-details' /* webpackChunkName: "kubevirt" */
        ).then((m) => m.SnapshotDetailsPage),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: '/catalog/create-vm',
      loader: () =>
        import(
          './components/create-vm/dev-console/dev-console-create-vm-form' /* webpackChunkName: "kubevirt" */
        ).then((m) => m.DevConsoleCreateVmForm),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: '/virtualization/new-customize-source',
      loader: () =>
        import(
          './components/vm-templates/customize-source/CustomizeSourceForm' /* webpackChunkName: "kubevirt" */
        ).then((m) => m.default),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: '/virtualization/customize-source',
      loader: () =>
        import(
          './components/vm-templates/customize-source/CustomizeSource' /* webpackChunkName: "kubevirt" */
        ).then((m) => m.default),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Dashboards/Overview/Health/URL',
    properties: {
      title: 'Virtualization',
      url: `apis/subresources.${models.VirtualMachineModel.apiGroup}/${models.VirtualMachineModel.apiVersion}/healthz`,
      healthHandler: getKubevirtHealthState,
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      additionalResources: {
        vmis: {
          isList: true,
          kind: models.VirtualMachineInstanceModel.kind,
        },
        pods: {
          isList: true,
          kind: PodModel.kind,
        },
        migrations: {
          isList: true,
          kind: models.VirtualMachineInstanceMigrationModel.kind,
        },
        pvcs: {
          isList: true,
          kind: PersistentVolumeClaimModel.kind,
          optional: true,
        },
        dataVolumes: {
          kind: models.DataVolumeModel.kind,
          isList: true,
          optional: true,
        },
        vmImports: {
          isList: true,
          kind: models.VirtualMachineImportModel.kind,
          optional: true,
        },
      },
      model: models.VirtualMachineModel,
      mapper: () =>
        import(
          './components/dashboards-page/overview-dashboard/inventory' /* webpackChunkName: "kubevirt" */
        ).then((m) => m.getVMStatusGroups),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Dashboards/Inventory/Item/Group',
    properties: {
      id: 'vm-off',
      icon: <VMOffGroupIcon />,
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Dashboards/Storage/Capacity/Dropdown/Item',
    properties: {
      metric: 'VMs vs Pods',
      queries: [
        'sum((kube_persistentvolumeclaim_resource_requests_storage_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info{pod=~"virt-launcher-.*"}) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
        'sum((kube_persistentvolumeclaim_resource_requests_storage_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info{pod !~"virt-launcher-.*"}) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
      ],
      required: FLAG_KUBEVIRT,
    },
  },
  {
    type: 'Project/Dashboard/Inventory/Item',
    properties: {
      additionalResources: [
        {
          isList: true,
          kind: models.VirtualMachineInstanceModel.kind,
          prop: 'vmis',
        },
        {
          isList: true,
          kind: PodModel.kind,
          prop: 'pods',
        },
        {
          isList: true,
          kind: models.VirtualMachineInstanceMigrationModel.kind,
          prop: 'migrations',
        },
        {
          isList: true,
          optional: true,
          kind: PersistentVolumeClaimModel.kind,
          prop: 'pvcs',
        },
        {
          isList: true,
          optional: true,
          kind: models.DataVolumeModel.kind,
          prop: 'dataVolumes',
        },
        {
          isList: true,
          optional: true,
          kind: models.VirtualMachineImportModel.kind,
          prop: 'vmImports',
        },
      ],
      model: models.VirtualMachineModel,
      mapper: getVMStatusGroups,
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        kind: models.DataVolumeModel.kind,
        prop: 'dvs',
      },
      isActivity: (resource) =>
        resource?.status?.phase === 'ImportInProgress' &&
        Object.keys(diskImportKindMapping).includes(resource?.metadata?.ownerReferences?.[0]?.kind),
      getTimestamp: (resource) => new Date(resource.metadata.creationTimestamp),
      loader: () =>
        import(
          './components/dashboards-page/overview-dashboard/activity' /* webpackChunkName: "kubevirt-activity" */
        ).then((m) => m.DiskImportActivity),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        kind: PodModel.kind,
        prop: 'pods',
      },
      isActivity: (resource) => getName(resource).startsWith('kubevirt-v2v-conversion'),
      getTimestamp: (resource) => new Date(resource.metadata.creationTimestamp),
      loader: () =>
        import(
          './components/dashboards-page/overview-dashboard/activity' /* webpackChunkName: "kubevirt-activity" */
        ).then((m) => m.V2VImportActivity),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  ...getTopologyPlugin([FLAG_KUBEVIRT]),
];

export default plugin;
