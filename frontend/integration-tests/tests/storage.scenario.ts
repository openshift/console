import { $, browser, ExpectedConditions as until } from 'protractor';
import { testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as storageView from '../views/storage.view';
import { execSync } from 'child_process';

describe('Add storage is applicable for all workloads', () => {
  const k8sWorkloads = [
    'replicationcontrollers',
    'daemonsets',
    'deployments',
    'replicasets',
    'statefulsets',
  ];
  const openshiftWorkloads = ['deploymentconfigs'];
  const resourceObjs =
    browser.params.openshift === 'true' ? k8sWorkloads.concat(openshiftWorkloads) : k8sWorkloads;

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(() => {
    resourceObjs.forEach((resourceType) => {
      try {
        execSync(`kubectl delete --cascade ${resourceType} example -n ${testName}`);
      } catch (error) {
        console.error(`Failed to delete ${resourceType} example:\n${error}`);
      }
    });
  });

  resourceObjs.forEach((resourceType) => {
    /* TODO: remove this IF statement and figure out
     * why getting this error when trying to click details page action button for statefulsets:
     *  Element <button type="button" aria-haspopup="true" aria-label="Actions" aria-expanded="false"
     *    class="pf-c-dropdown__toggle" data-test-id="actions-menu-button">...</button> is not clickable at point
     *  (1825, 221). Other element would receive the click: <button type="button" class="pf-c-table__button">...</button>
     *
     * Statefulsets seems to be the only details page w/ sub-table with sortable Name column header/button
     * Suspect PFv4 use of pf-c-table__button <button /> `::before` is covering up detail page button.
     */
    if (resourceType === 'statefulsets') {
      return;
    }
    describe(resourceType, () => {
      const pvcName = `${resourceType}-pvc`;
      const pvcSize = '1';
      const mountPath = '/data';

      it(`create a ${resourceType} resource`, async () => {
        await crudView.createNamespacedResourceWithDefaultYAML(resourceType);
        expect(crudView.errorMessage.isPresent()).toBe(false);
      });

      it(`add storage to ${resourceType}`, async () => {
        await storageView.addNewStorageToWorkload(pvcName, pvcSize, mountPath);
        expect(crudView.errorMessage.isPresent()).toBe(false);

        await browser.wait(until.presenceOf($(`[data-test-volume-name-for="${pvcName}"]`)));
        expect($(`[data-test-volume-name-for="${pvcName}"]`).getText()).toEqual(pvcName);
        expect($(`[data-test-mount-path-for="${pvcName}"]`).getText()).toEqual(mountPath);
      });
    });
  });
});
