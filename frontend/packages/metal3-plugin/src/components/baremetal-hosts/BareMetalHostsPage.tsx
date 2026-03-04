import type { FC } from 'react';
import type { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import type { WatchK8sResourceWithProp } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { MultiListPage } from '@console/internal/components/factory';
import { MachineModel, MachineSetModel, NodeModel } from '@console/internal/models';
import type {
  K8sResourceCommon,
  MachineKind,
  MachineSetKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { getName, createLookup, getNodeMachineName } from '@console/shared';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import { getHostMachine, getNodeMaintenanceNodeName } from '../../selectors';
import { getMachineMachineSetOwner } from '../../selectors/machine';
import { getHostStatus } from '../../status/host-status';
import type { BareMetalHostKind } from '../../types';
import type { BareMetalHostBundle } from '../types';
import BareMetalHostsTable from './BareMetalHostsTable';
import { hostStatusFilter } from './table-filters';

type Resources = {
  hosts: WatchK8sResultsObject<BareMetalHostKind[]>;
  machines: WatchK8sResultsObject<MachineKind[]>;
  machineSets: WatchK8sResultsObject<MachineSetKind[]>;
  nodes: WatchK8sResultsObject<NodeKind[]>;
  nodeMaintenances: WatchK8sResultsObject<K8sResourceCommon[]>;
};

const flattenResources = (resources: Resources) => {
  // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
  // when resources are loaded
  const loaded = _.every(resources, (resource) => resource.loaded);

  if (loaded) {
    const { hosts, machines, machineSets, nodes, nodeMaintenances } = resources;
    const hostsData = hosts?.data || [];
    const machinesData = machines?.data || [];

    const maintenancesByNodeName = createLookup(nodeMaintenances, getNodeMaintenanceNodeName);
    const nodesByMachineName = createLookup(nodes, getNodeMachineName);
    const machineSetByUID = createLookup(machineSets);

    return hostsData.map(
      (host): BareMetalHostBundle => {
        // TODO(jtomasek): replace this with createLookup once there is metal3.io/BareMetalHost annotation
        // on machines
        const machine = getHostMachine(host, machinesData);
        const node = nodesByMachineName[getName(machine)];
        const nodeMaintenance = maintenancesByNodeName[getName(node)];
        const machineOwner = getMachineMachineSetOwner(machine);
        const machineSet = machineOwner && machineSetByUID[machineOwner.uid];

        const status = getHostStatus({ host, machine, node, nodeMaintenance });
        // TODO(jtomasek): metadata.name is needed to make 'name' textFilter work.
        // Remove it when it is possible to pass custom textFilter as a function
        return {
          metadata: { name: getName(host) },
          host,
          machine,
          node,
          nodeMaintenance,
          machineSet,
          status,
        };
      },
    );
  }
  return [];
};

type BareMetalHostsPageProps = {
  namespace: string;
};

const getCreateProps = ({ namespace, t }: { namespace: string; t: TFunction }) => {
  const items: any = {
    dialog: t('metal3-plugin~New with Dialog'),
    yaml: t('metal3-plugin~New from YAML'),
  };

  return {
    items,
    createLink: (itemName) => {
      const base = `/k8s/ns/${namespace || 'default'}/${referenceForModel(BareMetalHostModel)}`;

      switch (itemName) {
        case 'dialog':
          return `${base}/~new/form`;
        case 'yaml':
        default:
          return `${base}/~new`;
      }
    },
  };
};

const BareMetalHostsPage: FC<BareMetalHostsPageProps> = (props) => {
  const { t } = useTranslation();
  const [model] = useMaintenanceCapability();
  const { namespace } = props;
  const resources: WatchK8sResourceWithProp[] = [
    {
      kind: referenceForModel(BareMetalHostModel),
      namespaced: true,
      prop: 'hosts',
    },
    {
      kind: referenceForModel(MachineModel),
      namespaced: true,
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
      prop: 'nodes',
    },
  ];

  if (model) {
    resources.push({
      kind: referenceForModel(model),
      namespaced: false,
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  return (
    <MultiListPage
      {...props}
      canCreate
      rowFilters={[hostStatusFilter(t)]}
      createProps={getCreateProps({ namespace, t })}
      createButtonText={t('metal3-plugin~Add Host')}
      namespace={namespace}
      resources={resources}
      flatten={flattenResources}
      ListComponent={BareMetalHostsTable}
      title={t('metal3-plugin~Bare Metal Hosts')}
    />
  );
};

export default BareMetalHostsPage;
