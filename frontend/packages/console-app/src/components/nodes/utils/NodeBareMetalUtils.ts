import { useAccessibleResources } from '@console/app/src/components/nodes/utils/useAccessibleResources';
import type {
  K8sGroupVersionKind,
  K8sResourceKind,
  WatchK8sResult,
} from '@console/dynamic-plugin-sdk/src';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { MachineModel } from '@console/internal/models';
import type { K8sKind, MachineKind } from '@console/internal/module/k8s';
import { getName, getNodeMachineNameAndNamespace } from '@console/shared/src';

export const BAREMETAL_FLAG = 'BAREMETAL';

export const BareMetalHostModel: K8sKind = {
  label: 'Bare Metal Host',
  labelPlural: 'Bare Metal Hosts',
  apiVersion: 'v1alpha1',
  apiGroup: 'metal3.io',
  plural: 'baremetalhosts',
  abbr: 'BMH',
  namespaced: true,
  kind: 'BareMetalHost',
  id: 'baremetalhost',
  crd: true,
};

export const BareMetalHostGroupVersionKind: K8sGroupVersionKind = {
  group: 'metal3.io',
  kind: 'BareMetalHost',
  version: 'v1alpha1',
};

export const useIsBareMetalPluginActive = () => useFlag(BAREMETAL_FLAG);

export const getHostMachine = (
  host: K8sResourceKind,
  machines: MachineKind[] = [],
): MachineKind | undefined =>
  machines.find((machine: MachineKind) => host.spec?.consumerRef?.name === getName(machine));

export const findBareMetalHostByNode = (
  hosts: K8sResourceKind[],
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

export const useWatchBareMetalHost = (
  node: NodeKind,
): WatchK8sResult<K8sResourceKind | undefined> => {
  const isBareMetalPluginActive = useIsBareMetalPluginActive();

  const [bareMetalHosts, bareMetalHostsLoaded, bareMetalHostsLoadError] = useAccessibleResources<
    K8sResourceKind
  >(
    isBareMetalPluginActive
      ? {
          groupVersionKind: BareMetalHostGroupVersionKind,
          isList: true,
          namespaced: true,
        }
      : undefined,
  );
  const [machines, machinesLoaded, machinesLoadError] = useAccessibleResources<MachineKind>(
    isBareMetalPluginActive
      ? {
          groupVersionKind: {
            group: MachineModel.apiGroup,
            version: MachineModel.apiVersion,
            kind: MachineModel.kind,
          },
          isList: true,
          namespaced: true,
        }
      : undefined,
  );

  const bareMetalHost =
    bareMetalHostsLoaded && !bareMetalHostsLoadError && machinesLoaded && !machinesLoadError
      ? findBareMetalHostByNode(bareMetalHosts, machines, node)
      : undefined;

  return [
    bareMetalHost,
    bareMetalHostsLoaded && machinesLoaded,
    bareMetalHostsLoadError || machinesLoadError,
  ];
};

export const metricsFromBareMetalHosts = (
  bareMetalHost?: K8sResourceKind,
): { disks?: number; nics?: number; cpus?: number } => ({
  disks: bareMetalHost?.status?.hardware?.storage?.length,
  nics: bareMetalHost?.status?.hardware?.nics?.length,
  cpus: bareMetalHost?.status?.hardware?.cpu?.count,
});
