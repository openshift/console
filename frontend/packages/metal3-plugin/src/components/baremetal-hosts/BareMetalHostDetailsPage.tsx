import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, FirehoseResource } from '@console/internal/components/utils';
import { MachineModel, MachineSetModel, NodeModel } from '@console/internal/models';
import {
  K8sResourceKind,
  MachineKind,
  MachineSetKind,
  NodeKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { useFlag } from '@console/shared/src/hooks/flag';
import { getMachineNode, getMachineNodeName } from '@console/shared/src/selectors/machine';
import { BMO_ENABLED_FLAG } from '../../features';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import { findNodeMaintenance, getHostMachine } from '../../selectors';
import { getMachineMachineSetOwner } from '../../selectors/machine';
import { findMachineSet } from '../../selectors/machine-set';
import { getHostStatus } from '../../status/host-status';
import { BareMetalHostKind } from '../../types/host';
import BareMetalHostDetails from './BareMetalHostDetails';
import BareMetalHostDisks from './BareMetalHostDisks';
import BareMetalHostNICs from './BareMetalHostNICs';
import BareMetalHostDashboard from './dashboard/BareMetalHostDashboard';

type BareMetalHostDetailsPageProps = {
  namespace: string;
  name: string;
};

type ExtraResources = {
  machines: MachineKind[];
  machineSets: MachineSetKind[];
  nodes: NodeKind[];
  nodeMaintenances: K8sResourceKind[];
};

const BareMetalHostDetailsPage: FC<BareMetalHostDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const [maintenanceModel] = useMaintenanceCapability();
  const bmoEnabled = useFlag(BMO_ENABLED_FLAG);
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(MachineModel),
      namespaced: true,
      isList: true,
      prop: 'machines',
    },
    {
      kind: referenceForModel(MachineSetModel),
      namespaced: true,
      isList: true,
      prop: 'machineSets',
    },
    {
      kind: NodeModel.kind,
      namespaced: false,
      isList: true,
      prop: 'nodes',
    },
  ];

  if (maintenanceModel) {
    resources.push({
      kind: referenceForModel(maintenanceModel),
      namespaced: false,
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  const nicsPage = {
    href: 'nics',
    // t('metal3-plugin~Network Interfaces')
    nameKey: 'metal3-plugin~Network Interfaces',
    component: BareMetalHostNICs,
  };
  const disksPage = {
    href: 'disks',
    // t('metal3-plugin~Disks')
    nameKey: 'metal3-plugin~Disks',
    component: BareMetalHostDisks,
  };
  const dashboardPage = {
    href: '',
    // t('metal3-plugin~Overview')
    nameKey: 'metal3-plugin~Overview',
    component: BareMetalHostDashboard,
  };
  const detailsPage = {
    href: 'details',
    // t('metal3-plugin~Details')
    nameKey: 'metal3-plugin~Details',
    component: BareMetalHostDetails,
  };

  return (
    <DetailsPage
      {...props}
      pagesFor={() => [
        dashboardPage,
        detailsPage,
        navFactory.editYaml(),
        nicsPage,
        disksPage,
        navFactory.events(ResourceEventStream),
      ]}
      kind={referenceForModel(BareMetalHostModel)}
      resources={resources}
      customActionMenu={(k8sModel, host: BareMetalHostKind, extraResources: ExtraResources) => {
        const { machines, machineSets, nodes, nodeMaintenances } = extraResources;
        const machine = getHostMachine(host, machines);
        const node = getMachineNode(machine, nodes);
        const nodeName = getMachineNodeName(machine);
        const nodeMaintenance = findNodeMaintenance(nodeMaintenances, nodeName);
        const status = getHostStatus({ host, machine, node, nodeMaintenance });

        const machineOwner = getMachineMachineSetOwner(machine);
        const machineSet = findMachineSet(machineSets, machineOwner && machineOwner.uid);
        return Object.keys(host).length !== 0 ? (
          <LazyActionMenu
            context={{
              [referenceForModel(BareMetalHostModel)]: {
                host,
                machineSet,
                machine,
                bmoEnabled,
                nodeName,
                status,
                maintenanceModel,
                nodeMaintenance,
              },
            }}
            variant={ActionMenuVariant.DROPDOWN}
          />
        ) : null;
      }}
      customData={{
        hasNodeMaintenanceCapability: !!maintenanceModel,
        maintenanceModel,
        bmoEnabled,
        t,
      }}
    />
  );
};
export default BareMetalHostDetailsPage;
