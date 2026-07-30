import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { K8sResourceKind, NodeKind } from '@console/dynamic-plugin-sdk/src';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { MachineModel, NodeModel } from '@console/internal/models';
import type { MachineKind } from '@console/internal/module/k8s';
import { useAccessibleResources } from '@console/metal3-plugin/src/hooks/useAccessibleResources';
import { InventoryItem } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { getNodeMachineNameAndNamespace } from '@console/shared/src/selectors/node';
import { BareMetalHostModel } from '../../models';
import { getHostCPU, getHostNICs, getHostStorage } from '../../selectors/baremetal-hosts';
import type { BareMetalHostKind } from '../../types/host';

const getHostMachine = (
  host: K8sResourceKind,
  machines: MachineKind[] = [],
): MachineKind | undefined =>
  machines.find((machine: MachineKind) => host.spec?.consumerRef?.name === getName(machine));

const findBareMetalHostByNode = (
  hosts: BareMetalHostKind[],
  machines: MachineKind[],
  node: NodeKind,
) => {
  const [machineName, machineNamespace] = getNodeMachineNameAndNamespace(node);
  if (!machineName) {
    return undefined;
  }

  const nodeMachine = machines?.find(
    (machine) =>
      machineName === machine.metadata.name && machineNamespace === machine.metadata.namespace,
  );
  if (!nodeMachine) {
    return undefined;
  }

  return hosts?.find((host) => {
    const hostMachine = getHostMachine(host, machines);
    return nodeMachine.metadata.uid === hostMachine?.metadata.uid;
  });
};

type BareMetalHostInventoryItemsProps = {
  obj: BareMetalHostKind;
  loaded: boolean;
  nodeName: string;
};

const BareMetalHostInventoryItems: FC<BareMetalHostInventoryItemsProps> = ({
  obj,
  loaded,
  nodeName,
}) => {
  const { t } = useTranslation('metal3-plugin');

  const namespace = getNamespace(obj);
  const hostName = getName(obj);

  const NICTitleComponent = useCallback(
    ({ children }) => (
      <Link to={`${resourcePathFromModel(BareMetalHostModel, hostName, namespace)}/nics`}>
        {children}
      </Link>
    ),
    [hostName, namespace],
  );

  const DiskTitleComponent = useCallback(
    ({ children }) => (
      <Link to={`${resourcePathFromModel(NodeModel, nodeName)}/configuration?activeTab=storage`}>
        {children}
      </Link>
    ),
    [nodeName],
  );

  if (!obj) {
    return null;
  }

  return (
    <>
      <StackItem>
        <InventoryItem
          title={t('Disk')}
          isLoading={!loaded}
          count={getHostStorage(obj).length}
          TitleComponent={DiskTitleComponent}
        />
      </StackItem>
      <StackItem>
        <InventoryItem
          title={t('NIC')}
          isLoading={!loaded}
          count={getHostNICs(obj).length}
          TitleComponent={NICTitleComponent}
        />
      </StackItem>
      <StackItem>
        <InventoryItem title={t('CPU')} isLoading={!obj} count={getHostCPU(obj).count} />
      </StackItem>
    </>
  );
};

const BareMetalHostInventoryItemsForNode: FC<{ obj: NodeKind }> = ({ obj }) => {
  const [bareMetalHosts, bareMetalHostsLoaded, bareMetalHostsLoadError] = useAccessibleResources<
    BareMetalHostKind
  >({
    groupVersionKind: getGroupVersionKindForModel(BareMetalHostModel),
    isList: true,
    namespaced: true,
  });

  const [machines, machinesLoaded, machinesLoadError] = useAccessibleResources<MachineKind>({
    groupVersionKind: {
      group: MachineModel.apiGroup,
      version: MachineModel.apiVersion,
      kind: MachineModel.kind,
    },
    isList: true,
    namespaced: true,
  });

  const bareMetalHost = useMemo(
    () =>
      obj &&
      bareMetalHostsLoaded &&
      !bareMetalHostsLoadError &&
      machinesLoaded &&
      !machinesLoadError
        ? findBareMetalHostByNode(bareMetalHosts, machines, obj)
        : undefined,
    [
      bareMetalHosts,
      bareMetalHostsLoadError,
      bareMetalHostsLoaded,
      machines,
      machinesLoadError,
      machinesLoaded,
      obj,
    ],
  );

  const loaded = bareMetalHostsLoaded && machinesLoaded;

  return (
    <BareMetalHostInventoryItems obj={bareMetalHost} loaded={loaded} nodeName={getName(obj)} />
  );
};

export default BareMetalHostInventoryItemsForNode;
