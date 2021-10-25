import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { K8sKind } from '@console/dynamic-plugin-sdk/src';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel, PodModel, TemplateModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import {
  VM_DETAIL_CONSOLES_HREF,
  VM_DETAIL_DETAILS_HREF,
  VM_DETAIL_DISKS_HREF,
  VM_DETAIL_NETWORKS_HREF,
} from '../../constants';
import {
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  VM_DETAIL_ENVIRONMENT,
  VM_DETAIL_SNAPSHOTS,
} from '../../constants/vm';
import { useVMStatus } from '../../hooks/use-vm-status';
import {
  DataVolumeModel,
  VirtualMachineImportModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
  VirtualMachineSnapshotModel,
} from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getResource } from '../../utils';
import { VMDisksAndFileSystemsPage } from '../vm-disks/vm-disks';
import { VMNics } from '../vm-nics';
import { VMSnapshotsPage } from '../vm-snapshots/vm-snapshots';
import { PendingChangesWarningFirehose } from './pending-changes-warning';
import VMConsoleDetailsPage from './vm-console/VMConsoleDetailsPage';
import { VMDashboard } from './vm-dashboard';
import { VMDetailsFirehose } from './vm-details';
import { VMEnvironmentFirehose } from './vm-environment/vm-environment-page';
import { VMEvents } from './vm-events';

export const breadcrumbsForVMPage = (t: TFunction, match: any) => () => [
  {
    name: t('kubevirt-plugin~Virtualization'),
    path: `/k8s/ns/${match.params.ns || 'default'}/virtualization`,
  },
  {
    name: t('kubevirt-plugin~Virtual Machines'),
    path: `/k8s/ns/${match.params.ns || 'default'}/virtualization`,
  },
  {
    name: t('kubevirt-plugin~{{name}} Details', { name: match.params.name }),
    path: `${match.url}`,
  },
];

export const VirtualMachinesDetailsPage: React.FC<VirtualMachinesDetailsPageProps> = (props) => {
  const { name, ns: namespace } = props.match.params;
  const { t } = useTranslation();
  const [snapshotResource] = useK8sModel(kubevirtReferenceForModel(VirtualMachineSnapshotModel));
  const vmStatusBundle = useVMStatus(name, namespace);

  const dashboardPage = {
    href: '', // default landing page
    name: t('kubevirt-plugin~Overview'),
    component: VMDashboard,
  };

  const overviewPage = {
    href: VM_DETAIL_DETAILS_HREF,
    name: t('kubevirt-plugin~Details'),
    component: VMDetailsFirehose,
  };

  const consolePage = {
    href: VM_DETAIL_CONSOLES_HREF,
    name: t('kubevirt-plugin~Console'),
    component: VMConsoleDetailsPage,
  };

  const nicsPage = {
    href: VM_DETAIL_NETWORKS_HREF,
    name: t('kubevirt-plugin~Network Interfaces'),
    component: VMNics,
  };

  const disksPage = {
    href: VM_DETAIL_DISKS_HREF,
    name: t('kubevirt-plugin~Disks'),
    component: VMDisksAndFileSystemsPage,
  };

  const environmentPage = {
    href: VM_DETAIL_ENVIRONMENT,
    name: t('kubevirt-plugin~Environment'),
    component: VMEnvironmentFirehose,
  };

  const snapshotsPage = {
    href: VM_DETAIL_SNAPSHOTS,
    name: t('kubevirt-plugin~Snapshots'),
    component: VMSnapshotsPage,
  };

  const pages = [
    dashboardPage,
    overviewPage,
    navFactory.editYaml(),
    environmentPage,
    navFactory.events(VMEvents),
    consolePage,
    nicsPage,
    disksPage,
    ...(snapshotResource ? [snapshotsPage] : []),
  ];

  const resources = [
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(TemplateModel, {
      isList: true,
      namespace,
      prop: 'templates',
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
    }),
    {
      kind: kubevirtReferenceForModel(VirtualMachineInstanceMigrationModel),
      namespace,
      prop: 'migrations',
      isList: true,
    },
    {
      kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
      namespace,
      isList: true,
      prop: 'vmis',
      optional: true,
      fieldSelector: `metadata.name=${name}`, // Note(yaacov): we look for a list, instead of one obj, to avoid 404 response if no VMI exist.
    },
    {
      kind: kubevirtReferenceForModel(VirtualMachineImportModel),
      isList: true,
      namespace,
      prop: 'vmImports',
      optional: true,
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      prop: 'pvcs',
    },
    {
      kind: kubevirtReferenceForModel(DataVolumeModel),
      isList: true,
      namespace,
      prop: 'dataVolumes',
    },
  ];

  const actionMenu = (kindObjData: K8sKind, obj: K8sResourceKind) => {
    const resourceKind = referenceForModel(kindObjData);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };

  return (
    <DetailsPage
      {...props}
      name={name}
      namespace={namespace}
      kind={kubevirtReferenceForModel(VirtualMachineModel)}
      kindObj={VirtualMachineModel}
      customActionMenu={actionMenu}
      pages={pages}
      resources={resources}
      breadcrumbsFor={breadcrumbsForVMPage(t, props.match)}
      customData={{ kindObj: VirtualMachineModel }}
      getResourceStatus={() => vmStatusBundle.status.getSimpleLabel()}
    >
      <PendingChangesWarningFirehose name={name} namespace={namespace} />
    </DetailsPage>
  );
};

export type VirtualMachinesDetailsPageProps = {
  match: any;
};
