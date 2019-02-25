import { browser, ExpectedConditions as until } from 'protractor';
import { Set as ImmutableSet } from 'immutable';

import { appHost, testName, checkErrors, checkLogs } from '../../protractor.conf';
import * as overviewView from '../../views/overview.view';
import * as crudView from '../../views/crud.view';
import { DeploymentModel, StatefulSetModel, DeploymentConfigModel, DaemonSetModel } from '../../../public/models';

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
    await browser.get(`${appHost}/overview/ns/${testName}`);
    await crudView.isLoaded();
  });

  overviewResources.forEach((kindModel) => {
    describe(kindModel.labelPlural, () => {
      const resourceName = `${testName}-${kindModel.kind.toLowerCase()}`;
      beforeAll(async()=>{
        await crudView.createNamespacedTestResource(kindModel, resourceName);
      });

      it(`displays a ${kindModel.id} in the project overview list`, async() => {
        await browser.wait(until.presenceOf(overviewView.projectOverview));
        await overviewView.itemsAreVisible();
        expect(overviewView.getProjectOverviewListItem(kindModel, resourceName).isPresent()).toBeTruthy();
      });

      it(`shows ${kindModel.id} details sidebar when item is clicked`, async() => {
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
