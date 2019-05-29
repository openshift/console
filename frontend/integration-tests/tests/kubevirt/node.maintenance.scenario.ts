/* eslint-disable no-undef */
import { browser, ExpectedConditions as until } from 'protractor';

// eslint-disable-next-line no-unused-vars
import { waitForCount, removeLeakedResources, createResource, deleteResource, addLeakableResource, removeLeakableResource, waitForStringInElement } from './utils/utils';
import { POD_CREATE_DELETE_TIMEOUT, POD_CREATION_TIMEOUT, WAIT_TIMEOUT_ERROR, POD_TERMINATION_TIMEOUT, NODE_MAINTENANCE_STATUS, NODE_STOP_MAINTENANCE_TIMEOUT, NODE_READY_STATUS, PAGE_LOAD_TIMEOUT, TABS } from './utils/consts';
import { examplePod } from './mocks';
import { appHost, testName } from '../../protractor.conf';
import { isLoaded, filterForName, resourceRows, resourceTitle } from '../../views/crud.view';
import { listViewMaintenanceStatusForNode, listViewReadyStatusForNode } from '../../views/kubevirt/node.view';
import { detailViewAction } from '../../views/kubevirt/vm.actions.view';
import Pod from './models/pod';
import * as podView from '../../views/kubevirt/pod.view';


describe('Test Node Maintenance Mode', () => {
  const leakedResources = new Set<string>();
  const podResourceOpts = {name: `maintenance-${testName}`, namespace: testName, nodeSelector: {}};
  const podResource = examplePod(podResourceOpts);
  const pod = new Pod(podResourceOpts);
  let computeNodeName = '';
  let computeNodeHostname = '';
  let computeNodeURL = '';

  beforeAll(async() => {
    // Create an example hello-world pod
    createResource(podResource);
    addLeakableResource(leakedResources, podResource);

    await pod.navigateToTab(TABS.OVERVIEW);
    await pod.waitForStatusIcon(podView.statusIcons.running, POD_CREATION_TIMEOUT);

    // store hostname of the compute node
    computeNodeHostname = (await podView.nodeLink.getText()).split('.')[0];

    await podView.nodeLink.click();
    await isLoaded();
    // store name and url of the compute node
    computeNodeName = await resourceTitle.getText();
    computeNodeURL = await browser.getCurrentUrl();
  });

  beforeEach(async() => {
    await browser.get(computeNodeURL);
    await isLoaded;
    await detailViewAction('Start Maintenance', true);
  });

  afterEach(async() => {
    await browser.get(computeNodeURL);
    await isLoaded;
    await detailViewAction('Stop Maintenance', true);

    await browser.get(`${appHost}/k8s/cluster/nodes`);
    await isLoaded();

    await browser.wait(until.presenceOf(listViewReadyStatusForNode(computeNodeName)))
      .then(() => browser.wait(waitForStringInElement(listViewReadyStatusForNode(computeNodeName), NODE_READY_STATUS), NODE_STOP_MAINTENANCE_TIMEOUT));

    removeLeakedResources(leakedResources);
  });

  it('Terminates running pod on maintenance node', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/pods`);
    await isLoaded();

    await filterForName(pod.name);
    await browser.wait(until.and(waitForCount(resourceRows, 0)), POD_TERMINATION_TIMEOUT);
    removeLeakableResource(leakedResources, podResource);
  }, POD_CREATE_DELETE_TIMEOUT);

  it('Node in Maintenance mode is not schedulable', async() => {
    podResourceOpts.nodeSelector = {'kubernetes.io/hostname': computeNodeHostname};
    createResource(examplePod(podResourceOpts));
    addLeakableResource(leakedResources, podResource);

    // Verify Node is marked as in maintenance
    await browser.get(`${appHost}/k8s/cluster/nodes`);
    await isLoaded();
    await browser.wait(until.presenceOf(listViewMaintenanceStatusForNode(computeNodeName)))
      .then(() => browser.wait(waitForStringInElement(listViewMaintenanceStatusForNode(computeNodeName), NODE_MAINTENANCE_STATUS), PAGE_LOAD_TIMEOUT));

    await pod.navigateToTab(TABS.OVERVIEW);
    let errorMessage: string;
    try {
      await pod.waitForStatusIcon(podView.statusIcons.running, PAGE_LOAD_TIMEOUT);
    } catch (error) {
      errorMessage = error.message;
    }
    expect(errorMessage).toBe(WAIT_TIMEOUT_ERROR);

    deleteResource(podResource);
    removeLeakableResource(leakedResources, podResource);
  }, POD_CREATE_DELETE_TIMEOUT);
});
