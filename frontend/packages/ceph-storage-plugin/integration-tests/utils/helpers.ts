import { execSync } from 'child_process';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { ExpectedConditions as until, browser, $ } from 'protractor';
import * as _ from 'lodash';
import { POD_NAME_PATTERNS, SECOND } from './consts';

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

export const waitFor = async (element, text) => {
  let stillLoading = true;
  while (stillLoading) {
    await browser.wait(until.visibilityOf(element));
    const elemText = await element.getText();
    if (elemText.includes(text)) stillLoading = false;
    /* eslint-disable no-await-in-loop */
    await browser.sleep(5 * SECOND);
    // Sometimes it flickers additonal guard for reliability
    if (!elemText.includes(text)) stillLoading = true;
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
