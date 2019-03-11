/* eslint-disable no-undef, no-unused-vars */

import { browser, $, ExpectedConditions as until } from 'protractor';
import { execSync } from 'child_process';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as catalogPageView from '../../views/catalog-page.view';
import * as operatorHubView from '../../views/operator-hub.view';

describe('Subscribing to an Operator from OperatorHub', () => {
  const openCloudServices = new Set(['AMQ Streams', 'MongoDB']);

  afterAll(() => {
    // FIXME: Don't hardcode namespace for running tests against upstream k8s
    execSync(`kubectl delete catalogsourceconfig -n openshift-marketplace installed-community-${testName}`);
    execSync(`kubectl delete subscription -n ${testName} --all`);
    execSync(`kubectl delete clusterserviceversion -n ${testName} --all`);
    execSync(`kubectl delete operatorgroup -n ${testName} --all`);
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays OperatorHub with expected available operators', async() => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();

    openCloudServices.forEach(name => {
      expect(catalogPageView.catalogTileFor(name).isDisplayed()).toBe(true);
    });
  });

  it('displays Couchbase Operator operator when filter "Couchbase" is active', async() => {
    await catalogPageView.clickFilterCheckbox('Couchbase');

    expect(catalogPageView.catalogTileFor('Couchbase Operator').isDisplayed()).toBe(true);

    await catalogPageView.clickFilterCheckbox('Couchbase');
  });

  it('does not display Couchbase Operator operator when filter "Red Hat" is active', async() => {
    await catalogPageView.clickFilterCheckbox('Red Hat');

    expect(catalogPageView.catalogTileCount('Couchbase Operator')).toBe(0);

    await catalogPageView.clickFilterCheckbox('Red Hat');
  });

  it('displays "AMQ Streams" as an operator when using the filter "stre"', async() => {
    await catalogPageView.filterByKeyword('stre');

    expect(catalogPageView.catalogTileFor('AMQ Streams').isDisplayed()).toBe(true);

    await catalogPageView.filterByKeyword('');
  });

  it('displays "Clear All Filters" text when filters remove all operators from display', async() => {
    await catalogPageView.filterByKeyword('NoOperatorsTest');

    expect(catalogPageView.catalogTiles.count()).toBe(0);
    expect(catalogPageView.clearFiltersText.isDisplayed()).toBe(true);
  });

  it('clears all filters when "Clear All Filters" text is clicked', async() => {
    await catalogPageView.filterByKeyword('NoOperatorsTest');
    await catalogPageView.clearFiltersText.click();

    expect(catalogPageView.filterTextbox.getAttribute('value')).toEqual('');
    expect(catalogPageView.activeFilterCheckboxes.count()).toBe(0);

    openCloudServices.forEach(name => {
      expect(catalogPageView.catalogTileFor(name).isDisplayed()).toBe(true);
    });
  });

  openCloudServices.forEach(name => {
    it(`displays OperatorHubModalOverlay with correct content when ${name} operator is clicked`, async() => {
      await catalogPageView.catalogTileFor(name).click();
      await operatorHubView.operatorModalIsLoaded();

      expect(operatorHubView.operatorModal.isDisplayed()).toBe(true);
      expect(operatorHubView.operatorModalTitle.getText()).toEqual(name);

      await operatorHubView.closeOperatorModal();
      await operatorHubView.operatorModalIsClosed();
    });
  });

  it('shows the warning dialog when a community operator is clicked', async() => {
    await(catalogPageView.catalogTileFor('etcd').click());
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.closeCommunityWarningModal();
    await operatorHubView.operatorCommunityWarningIsClosed();
  });

  it('shows the community operator when "Show Community Operators" is accepted', async() => {
    await(catalogPageView.catalogTileFor('etcd').click());
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.acceptCommunityWarningModal();
    await operatorHubView.operatorCommunityWarningIsClosed();

    expect(operatorHubView.operatorModal.isDisplayed()).toBe(true);
    expect(operatorHubView.operatorModalTitle.getText()).toEqual('etcd');

    await operatorHubView.closeOperatorModal();
    await operatorHubView.operatorModalIsClosed();
  });

  it('filters OperatorHub tiles by Category', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);
    expect(catalogView.categoryTabs.isPresent()).toBe(true);
  });

  it('displays subscription creation form for selected Operator', async() => {
    await catalogPageView.catalogTileFor('etcd').click();
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.acceptCommunityWarningModal();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.operatorModalInstallBtn.click();

    expect(browser.getCurrentUrl()).toContain('/operatorhub/subscribe?pkg=etcd&catalog=community-operators&catalogNamespace=openshift-marketplace&targetNamespace=');
    expect(operatorHubView.createSubscriptionFormTitle.isDisplayed()).toBe(true);
  });

  it('selects target namespace for Operator subscription', async() => {
    await browser.wait(until.visibilityOf(operatorHubView.createSubscriptionFormInstallMode));

    expect($('input[value="OwnNamespace"]').getAttribute('disabled')).toBe(null);
  });

  it('displays Operator as subscribed in OperatorHub', async() => {
    await operatorHubView.installNamespaceDropdownBtn.click();
    await operatorHubView.installNamespaceDropdownFilter(testName);
    await operatorHubView.installNamespaceDropdownSelect(testName).click();

    await operatorHubView.createSubscriptionFormBtn.click();
    await crudView.isLoaded();

    expect(catalogPageView.catalogTileFor('etcd').$('.catalog-tile-pf-footer').getText()).toContain('Installed');
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async() => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.catalogTileFor('etcd').click();
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.acceptCommunityWarningModal();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(until.visibilityOf(crudView.rowForOperator('etcd')), 30000);
  });
});
