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

  it('shows an emtpy list when no resources exist', async() => {
    await browser.get(`${appHost}/overview/ns/${testName}`);
    await crudView.isLoaded();
    await expect(overviewView.projectOverviewListItems.count()).toEqual(0);
  });

  overviewResources.forEach((kindModel) => {
    describe(kindModel.labelPlural, () => {
      beforeAll(async()=>{
        await expect(overviewView.getProjectOverviewListItemsOfKind(kindModel).count()).toEqual(0);
        await expect(overviewView.getProjectOverviewListItem(kindModel, testName).isPresent()).toBeFalsy();
        await crudView.createNamespacedTestResource(kindModel);
      });

      it(`displays a ${kindModel.id} in the project overview list`, async() => {
        await browser.wait(until.presenceOf(overviewView.projectOverview));
        await overviewView.itemsAreVisible();
        await expect(overviewView.getProjectOverviewListItemsOfKind(kindModel).count()).toEqual(1);
        await expect(overviewView.getProjectOverviewListItem(kindModel, testName).isPresent()).toBeTruthy();
      });

      it(`shows ${kindModel.id} details sidebar when item is clicked`, async() => {
        await expect(overviewView.detailsSidebar.isPresent()).toBeFalsy();
        await overviewView.getProjectOverviewListItem(kindModel, testName).click();
        await overviewView.sidebarIsLoaded();
        await expect(overviewView.detailsSidebar.isDisplayed()).toBeTruthy();
        const title = await overviewView.detailsSidebarTitle.getText();
        await expect(title).toContain(kindModel.kind);
        await expect(title).toContain(testName);
      });
    });
  });
});
