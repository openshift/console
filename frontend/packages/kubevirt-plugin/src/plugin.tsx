import * as React from 'react';
import * as _ from 'lodash';
import * as virtualMachineIcon from './images/virtual-machine.svg';
import { AlertVariant } from '@patternfly/react-core';
import {
  Plugin,
  ResourceNSNavItem,
  OverviewCRD,
  ResourceListPage,
  ResourceDetailsPage,
  ModelFeatureFlag,
  YAMLTemplate,
  ModelDefinition,
  RoutePage,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewInventoryItem,
  DashboardsInventoryItemGroup,
  ReduxReducer,
  ProjectDashboardInventoryItem,
  DashboardsOverviewResourceActivity,
  ContextProvider,
  PVCCreateProp,
  PVCAlert,
  PVCStatus,
  PVCDelete,
} from '@console/plugin-sdk';
import { DashboardsStorageCapacityDropdownItem } from '@console/ceph-storage-plugin';
import { TemplateModel, PodModel, PersistentVolumeClaimModel } from '@console/internal/models';
import { getName } from '@console/shared/src/selectors/common';
import { AddAction } from '@console/dev-console/src/extensions/add-actions';
import { FirehoseResource } from '@console/internal/components/utils';
import * as models from './models';
import { VMTemplateYAMLTemplates, VirtualMachineYAMLTemplates } from './models/templates';
import { getKubevirtHealthState } from './components/dashboards-page/overview-dashboard/health';
import {
  getVMStatusGroups,
  VMOffGroupIcon,
} from './components/dashboards-page/overview-dashboard/inventory';
import kubevirtReducer from './redux';
import { accessReviewImportVM } from './utils/accessReview-v2v';
import { diskImportKindMapping } from './components/dashboards-page/overview-dashboard/utils';
import { TopologyConsumedExtensions, getTopologyPlugin } from './topology/topology-plugin';
import {
  CDIUploadContext,
  useCDIUploadHook,
} from './components/cdi-upload-provider/cdi-upload-provider';
import { killCDIBoundPVC } from './components/cdi-upload-provider/pvc-delete-extension';
import { isPvcBoundToCDI, isPvcUploading } from './selectors/pvc/selectors';
import './style.scss';

type ConsumedExtensions =
  | ResourceNSNavItem
  | OverviewCRD
  | ResourceListPage
  | ResourceDetailsPage
  | ModelFeatureFlag
  | YAMLTemplate
  | ModelDefinition
  | RoutePage
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewInventoryItem
  | DashboardsInventoryItemGroup
  | DashboardsStorageCapacityDropdownItem
  | ReduxReducer
  | ProjectDashboardInventoryItem
  | DashboardsOverviewResourceActivity
  | AddAction
  | TopologyConsumedExtensions
  | ContextProvider
  | PVCCreateProp
  | PVCAlert
  | PVCStatus
  | PVCDelete;

export const FLAG_KUBEVIRT = 'KUBEVIRT';

const virtualMachineConfigurations = (namespace: string): FirehoseResource[] => {
  const virtualMachineResource = [
    {
      isList: true,
      kind: models.VirtualMachineModel.kind,
      namespace,
      prop: 'virtualmachines',
      optional: true,
    },
    {
      isList: true,
      kind: models.VirtualMachineInstanceModel.kind,
      namespace,
      prop: 'virtualmachineinstances',
      optional: true,
    },
    {
      isList: true,
      kind: TemplateModel.kind,
      prop: 'virtualmachinetemplates',
      selector: {
        matchLabels: { 'template.kubevirt.io/type': 'base' },
      },
      optional: true,
    },
    {
      isList: true,
      kind: models.VirtualMachineInstanceMigrationModel.kind,
      namespace,
      prop: 'migrations',
      optional: true,
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
  ];
  return virtualMachineResource;
};

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.VirtualMachineModel,
      flag: FLAG_KUBEVIRT,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: virtualMachineConfigurations,
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Workloads',
      componentProps: {
        name: 'Virtualization',
        resource: 'virtualization',
      },
      mergeBefore: 'Deployments',
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
      useAbbr: true,
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
    type: 'ReduxReducer',
    properties: {
      namespace: 'kubevirt',
      reducer: kubevirtReducer,
    },
    flags: {
      required: [FLAG_KUBEVIRT],
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
      useAbbr: true,
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
  {
    type: 'AddAction',
    flags: {
      required: [FLAG_KUBEVIRT],
    },
    properties: {
      id: 'import-via-v2v',
      url: '/k8s/ns/:namespace/virtualization/~new-wizard?mode=import',
      label: 'Import Virtual Machine',
      description: 'Import a virtual machine from external hypervisor',
      icon: virtualMachineIcon,
      accessReview: accessReviewImportVM,
    },
  },
  ...getTopologyPlugin([FLAG_KUBEVIRT]),
  {
    type: 'ContextProvider',
    properties: {
      Provider: CDIUploadContext.Provider,
      useValueHook: useCDIUploadHook,
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'PVCCreateProp',
    properties: {
      label: 'With Data upload form',
      path: '~new/upload-form',
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'PVCAlert',
    properties: {
      loader: () =>
        import('./components/cdi-upload-provider/pvc-alert-extension').then(
          (m) => m.PVCAlertExtension,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'PVCStatus',
    properties: {
      priority: 10,
      predicate: isPvcUploading,
      loader: () =>
        import('./components/cdi-upload-provider/upload-pvc-popover').then(
          (m) => m.UploadPVCPopover,
        ),
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
  {
    type: 'PVCDelete',
    properties: {
      predicate: isPvcBoundToCDI,
      onPVCKill: killCDIBoundPVC,
      alert: {
        type: AlertVariant.warning,
        title: 'PVC Delete',
        body: () =>
          import('./components/cdi-upload-provider/pvc-delete-extension').then(
            (m) => m.PVCDeleteAlertExtension,
          ),
      },
    },
    flags: {
      required: [FLAG_KUBEVIRT],
    },
  },
];

export default plugin;
