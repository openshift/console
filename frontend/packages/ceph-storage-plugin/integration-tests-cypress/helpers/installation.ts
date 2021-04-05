import * as _ from 'lodash';
import { NodeKind } from 'public/module/k8s';

export const SIZE_MAP = {
  '512Gi': 0.5,
  '2Ti': 2,
  '4Ti': 4,
};

export const getPodName = (pod) => pod.metadata.name;

export const getPodRestartCount = (pod) => pod.status.containerStatuses[0].restartCount;

export const getPresentPod = (pods, podName: string) =>
  pods.items.find((pod) => getPodName(pod) === podName);

export const getIds = (nodes, type: string): number[] =>
  nodes.filter((node) => node.type === type).map((node) => node.id);

export const getNewOSDIds = (nodes, osds: number[]): number[] =>
  nodes
    .filter((node) => node.type === 'osd' && osds.indexOf(node.id) === -1)
    .map((node) => node.id);

export const createOSDTreeMap = (nodes) =>
  nodes.reduce((acc, curr) => Object.assign(acc, { [curr.id]: curr }), {});

export const verifyZoneOSDMapping = (zones: number[], osds: number[], osdtree): boolean => {
  let filteredOsds = [...osds];
  zones.forEach((zone) => {
    const hostId = osdtree[zone].children[0];
    const len = osdtree[hostId].children.length;
    filteredOsds = filteredOsds.filter((osd) => osd !== osdtree[hostId].children[len - 1]);
  });

  return filteredOsds.length === 0;
};

export const verifyNodeOSDMapping = (nodes: number[], osds: number[], osdtree): boolean => {
  let filteredOsds = [...osds];
  nodes.forEach((node) => {
    const len = osdtree[node].children.length;
    filteredOsds = filteredOsds.filter((osd) => osd !== osdtree[node].children[len - 1]);
  });

  return filteredOsds.length === 0;
};

export const isNodeReady = (node: NodeKind): boolean => {
  const conditions = node.status?.conditions ?? [];
  const readyState: any = _.find(conditions, { type: 'Ready' });

  return readyState && readyState.status === 'True';
};

export const getDeviceCount = (storageCluster) => storageCluster?.spec?.storageDeviceSets[0].count;
