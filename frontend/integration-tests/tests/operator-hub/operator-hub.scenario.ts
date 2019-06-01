import { browser, $, ExpectedConditions as until, element, by } from 'protractor';
import { execSync } from 'child_process';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as catalogPageView from '../../views/catalog-page.view';
import * as operatorHubView from '../../views/operator-hub.view';

describe('Subscribing to an Operator from OperatorHub', () => {
  let installedOperator: string;

  afterAll(() => {
    execSync(`kubectl delete subscription -n ${testName} --all`);
    execSync(`kubectl delete clusterserviceversion -n ${testName} --all`);
    execSync(`kubectl delete operatorgroup -n ${testName} --all`);
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays OperatorHub tile view with expected available Operators', async() => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });

  it('filters Operators by "Provider"', async() => {
    await catalogPageView.filterSectionFor('provider').$$('.filter-panel-pf-category-item').get(0).$('input').click();
    const filteredOperator = await catalogPageView.catalogTiles.first().$('.catalog-tile-pf-title').getText();

    await catalogPageView.filterSectionFor('provider').$$('.filter-panel-pf-category-item').get(0).$('input').click();
    await catalogPageView.filterSectionFor('provider').$$('.filter-panel-pf-category-item').get(1).$('input').click();

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
    expect(catalogPageView.catalogTiles.first().$('.catalog-tile-pf-title').getText()).not.toEqual(filteredOperator);
  });

  it('filters Operators by name', async() => {
    await $('.co-catalog-page__filter input').click();
    const filteredOperator = await catalogPageView.catalogTiles.first().$('.catalog-tile-pf-title').getText();
    await catalogPageView.filterByKeyword(filteredOperator);

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
    expect(catalogPageView.catalogTiles.first().$('.catalog-tile-pf-title').getText()).toEqual(filteredOperator);
  });

  it('displays "Clear All Filters" text when filters remove all Operators from display', async() => {
    await catalogPageView.filterByKeyword('NoOperatorsTest');

    expect(catalogPageView.catalogTiles.count()).toBe(0);
    expect(catalogPageView.clearFiltersText.isDisplayed()).toBe(true);
  });

  it('clears all filters when "Clear All Filters" text is clicked', async() => {
    await catalogPageView.clearFiltersText.click();

    expect(catalogPageView.filterTextbox.getAttribute('value')).toEqual('');
    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });

  it('shows the warning dialog when a community Operator is clicked', async() => {
    await catalogPageView.clickFilterCheckbox('providerType-community');
    await catalogPageView.catalogTiles.first().click();
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.closeCommunityWarningModal();
    await operatorHubView.operatorCommunityWarningIsClosed();
  });

  it('shows the community Operator details when "Show Community Operators" is accepted', async() => {
    const operatorTile = catalogPageView.catalogTiles.first();
    await operatorTile.click();
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.acceptForeverCommunityWarningModal();
    await operatorHubView.operatorCommunityWarningIsClosed();

    expect(operatorHubView.operatorModal.isDisplayed()).toBe(true);
    expect(operatorHubView.operatorModalTitle.getText()).toEqual(operatorTile.$('.catalog-tile-pf-title').getText());
  });

  it('filters Operators by catagory', async() => {
    await operatorHubView.closeOperatorModal();
    await operatorHubView.operatorModalIsClosed();
    await catalogView.categoryTabs.get(1).click();

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });

  it('displays subscription creation form for selected Operator', async() => {
    await catalogView.categoryTabs.get(0).click();
    installedOperator = await catalogPageView.catalogTiles.first().$('.catalog-tile-pf-title').getText();
    await catalogPageView.catalogTileFor(installedOperator).click();
    await browser.wait(until.visibilityOf(operatorHubView.operatorModal));
    await operatorHubView.operatorModalInstallBtn.click();
    await operatorHubView.createSubscriptionFormLoaded();

    expect(operatorHubView.createSubscriptionFormName.getText()).toEqual(installedOperator);
  });

  it('selects target namespace for Operator subscription', async() => {
    await browser.wait(until.visibilityOf(operatorHubView.createSubscriptionFormInstallMode));

    if (operatorHubView.singleNamespaceInstallMode.getAttribute('disabled') !== null) {
      await operatorHubView.singleNamespaceInstallMode.click();
      await browser.wait(until.visibilityOf(operatorHubView.installNamespaceDropdownBtn));
      await operatorHubView.installNamespaceDropdownBtn.click();
      await operatorHubView.installNamespaceDropdownFilter(testName);
      await operatorHubView.installNamespaceDropdownSelect(testName).click();
    }

    expect(operatorHubView.createSubscriptionError.isPresent()).toBe(false);
    expect(operatorHubView.createSubscriptionFormBtn.getAttribute('disabled')).toEqual(null);
  });

  it('displays Operator as subscribed in OperatorHub', async() => {
    await operatorHubView.createSubscriptionFormBtn.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('installState-installed');

    expect(catalogPageView.catalogTileFor(installedOperator).isDisplayed()).toBe(true);
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async() => {
    await catalogPageView.catalogTileFor(installedOperator).click();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(until.visibilityOf(crudView.rowForOperator(installedOperator)), 30000);
  });

  it('displays button to uninstall the Operator', async() => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('installState-installed');
    await catalogPageView.catalogTileFor(installedOperator).click();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.operatorModalUninstallBtn.click();

    expect(browser.getCurrentUrl()).toContain(`/ns/${testName}/subscriptions/`);
  });

  it('uninstalls Operator from the cluster', async() => {
    await browser.wait(until.visibilityOf($('.co-catalog-install-modal')));
    await element(by.cssContainingText('#confirm-action', 'Remove')).click();
    await crudView.isLoaded();

    expect(crudView.rowForOperator(installedOperator).isPresent()).toBe(false);
  });
});
