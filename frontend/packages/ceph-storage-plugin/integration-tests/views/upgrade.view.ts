import { $, by, element, ExpectedConditions as until, browser } from 'protractor';
import { execSync } from 'child_process';
import { click } from '@console/shared/src/test-utils/utils';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { goToInstalledOperators, currentSelectors } from './installFlow.view';
import { goToPersistentVolumeClaims, selectItemFromDropdown } from './pvc.view';
import { MINUTE, NS } from '../utils/consts';

export const image43Command =
  'oc get -n openshift-marketplace catalogSource ocs-catalogsource -o json|sed \'s/ocs-olm-operator:.*"/ocs-olm-operator:latest-stable-4.3.0"/g\'|oc apply -f -';
export const image44Command =
  'oc get -n openshift-marketplace catalogSource ocs-catalogsource -o json|sed \'s/ocs-olm-operator:.*"/ocs-olm-operator:latest-stable-4.4.0"/g\'|oc apply -f -';
export const image45Command =
  'oc get -n openshift-marketplace catalogSource ocs-catalogsource -o json|sed \'s/ocs-olm-operator:.*"/ocs-olm-operator:latest-stable-4.5.0"/g\'|oc apply -f -';

// Subscription tab
export const channelChangeButton = element(by.cssContainingText('button', 'stable-'));
export const channel42 = $('input[value="stable-4\\.2"]');
export const channel43 = $('input[value="stable-4\\.3"]');
export const channel44 = $('input[value="stable-4\\.4"]');
export const channel45 = $('input[value="stable-4\\.5"]');
const saveChange = $('#confirm-action');
export const installedVersion = $('a[title*=ocs-operator]');

// OCS Operator view
export const subscription = element(by.partialLinkText('Subscription'));
export const storageCluster = element(by.partialLinkText('Storage Cluster'));
export const namespaceDropdown = $('[data-test-id="namespace-bar-dropdown"] div div button');

export const goToOCSOperator = async () => {
  await goToInstalledOperators();
  await selectItemFromDropdown(NS, namespaceDropdown);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await click(currentSelectors.ocsOperator);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};

export const goToOCSSubscription = async () => {
  await goToOCSOperator();
  await click(subscription);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};

export const isStorageClusterReady = async () => {
  const storageClusterInfo = await JSON.parse(
    execSync(`kubectl get storagecluster ocs-storagecluster -o json -n ${NS} `).toString(),
  );
  const storageClusterState = storageClusterInfo.status.phase;
  return storageClusterState === 'Ready';
};

export const storageClusterVersion = async () => {
  const storageClusterInfo = await JSON.parse(
    execSync(`kubectl get storagecluster ocs-storagecluster -o json -n ${NS} `).toString(),
  );
  return storageClusterInfo.spec.version;
};

export const operatorVersion = async () => {
  await goToPersistentVolumeClaims();
  await goToOCSSubscription();
  return installedVersion.getText();
};

export const waitUntilStorageClusterReady = async () => {
  await browser.wait(
    isStorageClusterReady(),
    20 * MINUTE,
    'Storage Cluster should reach Ready state in 20 minutes',
  );
};

export const changeCatalogSourceImage = async (newValue: string) => {
  const newImageCommand = `oc get -n openshift-marketplace catalogSource ocs-catalogsource -o json|sed 's/ocs-olm-operator:.*\\"/ocs-olm-operator:${newValue}\\"/g'|oc apply -f -`;
  await execSync(newImageCommand);
  await browser.sleep(5 * MINUTE);
  await waitUntilStorageClusterReady();
};

export const changeChannel = async (channel) => {
  await goToOCSSubscription();
  // refresh until channel change button becomes clickable - https://bugzilla.redhat.com/show_bug.cgi?id=1822553
  let clickSuccessful = false;
  while (!clickSuccessful) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await click(channelChangeButton);
      // eslint-disable-next-line no-await-in-loop
      await click(channel);
      clickSuccessful = true;
    } catch (err) {
      browser.refresh();
    }
  }
  await click(saveChange);
  await browser.sleep(20 * MINUTE);
  await waitUntilStorageClusterReady();
  // subscription page shows 404 error by this time, so we need to navigate to some other page and then back
  await goToPersistentVolumeClaims();
  await goToOCSSubscription();
};
