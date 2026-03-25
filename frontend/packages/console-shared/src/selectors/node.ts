import type {
  NodeAddress,
  NodeKind,
  Taint,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

const NODE_ROLE_PREFIX = 'node-role.kubernetes.io/';

export const getNodeRoles = (node: NodeKind): string[] =>
  Object.keys(node?.metadata?.labels ?? {}).reduce<string[]>((acc, k) => {
    if (k.startsWith(NODE_ROLE_PREFIX)) {
      acc.push(k.slice(NODE_ROLE_PREFIX.length));
    }
    return acc;
  }, []);

export const getNodeRole = (node: NodeKind): string =>
  getNodeRoles(node).includes('control-plane') ? 'control-plane' : 'worker';

export const getNodeRoleMatch = (node: NodeKind, role: string): boolean =>
  getNodeRoles(node).filter((elem) => elem === role).length > 0;

export const getNodeAddresses = (node: NodeKind): NodeAddress[] => node?.status?.addresses ?? [];

export const getNodeMachineNameAndNamespace = (node: NodeKind): [string, string] => {
  const machine = node?.metadata?.annotations?.['machine.openshift.io/machine'] ?? '/';
  const [namespace, name] = machine.split('/');
  return [name, namespace];
};

export const getNodeMachineName = (node: NodeKind): string =>
  getNodeMachineNameAndNamespace(node)[0];

export const isNodeUnschedulable = (node: NodeKind): boolean => node?.spec?.unschedulable ?? false;

export const isNodeReady = (node: NodeKind): boolean => {
  return (
    node?.status?.conditions?.some?.(({ type, status }) => type === 'Ready' && status === 'True') ??
    false
  );
};

export const getNodeCPUCapacity = (node: NodeKind): string => node?.status?.capacity?.cpu ?? '';

export const getNodeAllocatableMemory = (node: NodeKind): string =>
  node?.status?.allocatable?.memory ?? '';

export const getNodeTaints = (node: NodeKind): Taint[] => node?.spec?.taints;

export const isWindowsNode = (node): boolean =>
  node?.metadata?.labels?.['node.openshift.io/os_id'] === 'Windows' ||
  node?.metadata?.labels?.['corev1.LabelOSStable'] === 'windows';

export const getNodeUptime = (node: NodeKind): string =>
  node?.status?.conditions?.find(({ type, status }) => type === 'Ready' && status === 'True')
    ?.lastTransitionTime;

export const getNodeArchitecture = (node: NodeKind) => {
  return node?.status?.nodeInfo?.architecture ?? '';
};
