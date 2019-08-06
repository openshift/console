import { browser, BROWSER_TIMEOUT, ExpectedConditions as until } from 'protractor';
import { Set as ImmutableSet } from 'immutable';

import { appHost, testName, checkErrors, checkLogs } from '../../protractor.conf';
import * as overviewView from '../../views/overview.view';
import * as crudView from '../../views/crud.view';
import { DeploymentModel, StatefulSetModel, DeploymentConfigModel, DaemonSetModel } from '../../../public/models';
import { execSync } from 'child_process';

const overviewResources = ImmutableSet([
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  StatefulSetModel,
]);

describe('Visiting Overview page', () => {
  afterEach(() => {
    checkErrors();
    checkLogs();
  });

  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/cluster/projects/${testName}/workloads`);
    await crudView.isLoaded();
  });

  overviewResources.forEach((kindModel) => {
    describe(kindModel.labelPlural, () => {
      const resourceName = `${testName}-${kindModel.kind.toLowerCase()}`;
      beforeAll(async()=>{
        await crudView.createNamespacedTestResource(kindModel, resourceName);
        await browser.get(`${appHost}/k8s/cluster/projects/${testName}/workloads`);
      });

      it(`displays a ${kindModel.id} in the project overview list`, async() => {
        await browser.wait(until.presenceOf(overviewView.projectOverview));
        await overviewView.itemsAreVisible();
        expect(overviewView.getProjectOverviewListItem(kindModel, resourceName).isPresent()).toBeTruthy();
      });

      it('clicking on N of N pods takes you to Pods page', async() => {
        await overviewView.ClickOverviewItemsDetailsPodsLink(kindModel);
        if ( kindModel.kind === 'DaemonSet' || kindModel.kind === 'StatefulSet') {
          const resourceKind = kindModel.kind.toLowerCase().concat('s');
          expect(browser.wait(until.urlContains(`${appHost}/k8s/ns/${testName}/${resourceKind}/${resourceName}/pods`), BROWSER_TIMEOUT));
        } else if ( kindModel.kind === 'DeploymentConfig' ) {
          const replicationcontrollername = resourceName.concat('-1');
          expect(browser.wait(until.urlContains(`${appHost}/k8s/ns/${testName}/replicationcontrollers/${replicationcontrollername}/pods`), BROWSER_TIMEOUT));
        } else {
          const rsoutput = execSync(`kubectl get replicasets -n ${testName} -o json`);
          const replicasetname = JSON.parse(rsoutput).items[0].metadata.name;
          console.log(replicasetname);
          expect(browser.wait(until.urlContains(`${appHost}/k8s/ns/${testName}/replicasets/${replicasetname}/pods`), BROWSER_TIMEOUT));
        }
      });

      // Disabling for now due to flake https://jira.coreos.com/browse/CONSOLE-1298
      xit(`CONSOLE-1298 - shows ${kindModel.id} details sidebar when item is clicked`, async() => {
        const overviewListItem = overviewView.getProjectOverviewListItem(kindModel, resourceName);
        expect(overviewView.detailsSidebar.isPresent()).toBeFalsy();
        await browser.wait(until.elementToBeClickable(overviewListItem));
        await overviewListItem.click();
        await overviewView.sidebarIsLoaded();
        expect(overviewView.detailsSidebar.isDisplayed()).toBeTruthy();
        expect(overviewView.detailsSidebarTitle.getText()).toContain(resourceName);
      });
    });
  });
});
