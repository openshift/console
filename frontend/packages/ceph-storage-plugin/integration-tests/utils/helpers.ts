import { execSync } from 'child_process';
import * as _ from 'lodash';
import { ExpectedConditions as until, browser, $ } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { OSD, POD_NAME_PATTERNS, SECOND, ocsTaint } from './consts';

export const checkIfClusterIsReady = async () => {
  let stillLoading = true;
  while (stillLoading) {
    const scRes = JSON.parse(
      execSync('kubectl get -o json -n openshift-storage storagecluster').toString(),
    );
    if (_.get(scRes, 'items[0].status.phase') === 'Ready') {
      stillLoading = false;
    }
    /* eslint-disable no-await-in-loop */
    await browser.sleep(10 * SECOND);
  }
};

export const waitUntil = async (functor, expected, count = 1) => {
  const value = await functor();
  if (value < expected) {
    await browser.sleep(2 * SECOND);
    await waitUntil(functor, expected, count - 1);
  }
  return true;
};

export const waitFor = async (element, text, count = 1) => {
  let rowNumber = 0;
  while (rowNumber !== count) {
    await browser.wait(until.visibilityOf(element));
    const elemText = await element.getText();
    if (elemText.includes(text)) {
      rowNumber += 1;
    } else {
      rowNumber = 0;
    }
    /* eslint-disable no-await-in-loop */
    await browser.sleep(5 * SECOND);
  }
};

export const getPodData = (list, pattern: string) => {
  const pods = [];
  list.forEach((item) => {
    if (item.metadata.name.includes(pattern)) pods.push(item);
  });
  if (pods.length === 1) return pods[0];
  return pods;
};

export const getPodPhase = (pod) => {
  return pod.status.phase;
};

export const getPodRestartCount = (pod) => {
  return pod.status.containerStatuses[0].restartCount;
};

export const getPodName = (pod) => {
  return pod.metadata.name;
};

export const testPodIsRunning = (podPhase: string) => expect(podPhase).toBe('Running');
export const testPodIsSucceeded = (podPhase: string) => expect(podPhase).toBe('Succeeded');

export const getDataFromRowAndCol = async (
  row: number,
  col: number,
  filter: Function,
): Promise<string> => {
  /**
   * Row is the data-row you want to parse ( row count starts from 0 )
   * Col is the col you want to parse (Col count starts from 1 )
   * filter is applied to getText value of the (row, col)
   */
  await browser.wait(until.visibilityOf($(`tr[data-index="${row}"] td:nth-child(${col})`)));
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  const text = await $(`tr[data-index="${row}"] td:nth-child(${col})`).getText();
  const filtered = filter(text);
  return filtered;
};

export const podNameFilter = (name) => name.split('\n')[2];
// Works for status and readiness
export const statusFilter = (stat) => stat.split('\n')[0];

export const sendKeys = async (element, keys: string) => {
  await browser.wait(until.visibilityOf(element));
  await element.clear();
  await element.sendKeys(keys);
  await browser.sleep(200);
};

export const verifyNodeLabels = (nodeName: string, label: string): boolean => {
  const node = JSON.parse(execSync(`oc get node ${nodeName} -o json`).toString('utf-8'));
  const labels = Object.keys(node.metadata.labels);
  if (labels.includes(label)) return true;
  return false;
};

export const isPodPresent = (pods, podName) => {
  const podObj = pods.items.find((pod) => getPodName(pod) === podName);
  return podObj || '';
};

export const getOSDPreparePodsCnt = (pods) =>
  pods.items.filter((pod) => getPodName(pod).includes(POD_NAME_PATTERNS.ROOK_CEPH_OSD_PREPARE))
    .length;

export const refreshIfNotVisible = async (element, maxTimes = 1) => {
  let isVisible = await element.isPresent();
  let count = 0;
  while (count < maxTimes) {
    if (!isVisible) {
      /* eslint-disable no-await-in-loop */
      await browser.refresh();
      await browser.sleep(5 * SECOND);
      isVisible = await element.isPresent();
    }
    count += 1;
  }
};

export const getIds = (nodes: NodeType[], type: string): number[] =>
  nodes.filter((node) => node.type === type).map((node) => node.id);

export const getNewOSDIds = (nodes: NodeType[], osds: number[]): number[] =>
  nodes.filter((node) => node.type === OSD && osds.indexOf(node.id) === -1).map((node) => node.id);

// created dictionary for faster acess O(1)
export const createOSDTreeMap = (nodes: NodeType[]): FormattedOsdTreeType => {
  const tree = {};
  nodes.forEach((node) => {
    tree[node.id] = node;
  });
  return tree;
};

export const verifyZoneOSDMapping = (
  zones: number[],
  osds: number[],
  osdtree: FormattedOsdTreeType,
): boolean => {
  let filteredOsds = [...osds];
  zones.forEach((zone) => {
    const hostId = osdtree[zone].children[0];
    const len = osdtree[hostId].children.length;
    filteredOsds = filteredOsds.filter((osd) => osd !== osdtree[hostId].children[len - 1]);
  });

  return filteredOsds.length === 0;
};

export const verifyNodeOSDMapping = (
  nodes: number[],
  osds: number[],
  osdtree: FormattedOsdTreeType,
): boolean => {
  let filteredOsds = [...osds];
  nodes.forEach((node) => {
    const len = osdtree[node].children.length;
    filteredOsds = filteredOsds.filter((osd) => osd !== osdtree[node].children[len - 1]);
  });

  return filteredOsds.length === 0;
};

export const hasTaints = (node) => {
  return !_.isEmpty(node.spec?.taints);
};

export const hasOCSTaint = (node) => {
  const taints = node?.spec?.taints || [];
  return taints.some((taint) => _.isEqual(taint, ocsTaint));
};

export type NodeType = {
  id: number;
  name: string;
  type: string;
  type_id: number;
  children: number[];
  pool_weights?: {};
  device_class?: string;
  crush_weight?: number;
  depth?: number;
  exists?: number;
  status?: string;
  reweight?: number;
  primary_affinity?: number;
};

export type FormattedOsdTreeType = {
  [key: string]: NodeType;
};

export type PvcType = {
  name: string;
  namespace: string;
  size: string;
  sizeUnits: string;
  storageClass: string;
  accessMode: string;
};
