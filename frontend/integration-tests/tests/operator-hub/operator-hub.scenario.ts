/* eslint-disable no-undef, no-unused-vars */

import { browser, $, ExpectedConditions as until, element, by } from 'protractor';
import { execSync } from 'child_process';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as catalogPageView from '../../views/catalog-page.view';
import * as operatorHubView from '../../views/operator-hub.view';

describe('Subscribing to an Operator from OperatorHub', () => {
  const openCloudServices = new Set([
    {id: 'amq-streams-openshift-marketplace', name: 'Red Hat Integration - AMQ Streams'},
    {id: 'mongodb-enterprise-openshift-marketplace', name: 'MongoDB'},
  ]);

  afterAll(() => {
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

    openCloudServices.forEach(operator => {
      expect(catalogPageView.catalogTileById(operator.id).isDisplayed()).toBe(true);
    });
  });

  it('displays Couchbase Operator operator when filter "Couchbase" is active', async() => {
    await catalogPageView.showMoreFilters('provider').click();
    await catalogPageView.clickFilterCheckbox('provider-couchbase');
    await browser.wait(until.visibilityOf(catalogPageView.catalogTileById('couchbase-enterprise-certified-openshift-marketplace')));

    expect(catalogPageView.catalogTiles.count()).toEqual(1);

    await catalogPageView.clickFilterCheckbox('provider-couchbase');
  });

  it('does not display Couchbase Operator operator when filter "Red Hat" is active', async() => {
    await catalogPageView.clickFilterCheckbox('provider-red-hat');
    await browser.wait(until.invisibilityOf(catalogPageView.catalogTileById('couchbase-enterprise-certified-openshift-marketplace')));

    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(1);

    await catalogPageView.clickFilterCheckbox('provider-red-hat');
  });

  it('displays "AMQ Streams" as an operator when using the filter "stre"', async() => {
    await catalogPageView.filterByKeyword('stre');

    expect(catalogPageView.catalogTileById('amq-streams-openshift-marketplace').isDisplayed()).toBe(true);

    await catalogPageView.filterByKeyword('');
  });

  it('displays "Clear All Filters" text when filters remove all operators from display', async() => {
    await catalogPageView.clickFilterCheckbox('provider-red-hat');
    await catalogPageView.filterByKeyword('NoOperatorsTest');

    expect(catalogPageView.catalogTiles.count()).toBe(0);
    expect(catalogPageView.clearFiltersText.isDisplayed()).toBe(true);
  });

  it('clears all filters when "Clear All Filters" text is clicked', async() => {
    await catalogPageView.filterByKeyword('NoOperatorsTest');
    expect(catalogPageView.filterCheckboxFor('provider-red-hat').isSelected()).toBe(true);
    await catalogPageView.clearFiltersText.click();

    expect(catalogPageView.filterTextbox.getAttribute('value')).toEqual('');
    expect(catalogPageView.filterCheckboxFor('provider-red-hat').isSelected()).toBe(false);

    openCloudServices.forEach(operator => {
      expect(catalogPageView.catalogTileById(operator.id).isDisplayed()).toBe(true);
    });
  });

  openCloudServices.forEach(operator => {
    it(`displays OperatorHubModalOverlay with correct content when ${operator.name} operator is clicked`, async() => {
      await catalogPageView.catalogTileById(operator.id).click();
      await operatorHubView.operatorModalIsLoaded();

      expect(operatorHubView.operatorModal.isDisplayed()).toBe(true);
      expect(operatorHubView.operatorModalTitle.getText()).toEqual(operator.name);

      await operatorHubView.closeOperatorModal();
      await operatorHubView.operatorModalIsClosed();
    });
  });

  it('shows the warning dialog when a community operator is clicked', async() => {
    await(catalogPageView.catalogTileById('etcd-openshift-marketplace').click());
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.closeCommunityWarningModal();
    await operatorHubView.operatorCommunityWarningIsClosed();
  });

  it('shows the community operator when "Show Community Operators" is accepted', async() => {
    await(catalogPageView.catalogTileById('etcd-openshift-marketplace').click());
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
    await catalogPageView.catalogTileById('etcd-openshift-marketplace').click();
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.acceptCommunityWarningModal();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.operatorModalInstallBtn.click();

    expect(browser.getCurrentUrl()).toContain('/operatorhub/subscribe?pkg=etcd&catalog=community-operators&catalogNamespace=openshift-marketplace&targetNamespace=');
  });

  it('selects target namespace for Operator subscription', async() => {
    await browser.wait(until.visibilityOf(operatorHubView.createSubscriptionFormInstallMode));
    await $('input[value="singlenamespace-alpha"]').click();

    expect($('input[value="SingleNamespace"]').getAttribute('disabled')).toBe(null);
  });

  it('displays Operator as subscribed in OperatorHub', async() => {
    await $('input[value="SingleNamespace"]').click();
    await browser.wait(until.visibilityOf(operatorHubView.installNamespaceDropdownBtn));
    await operatorHubView.installNamespaceDropdownBtn.click();
    await operatorHubView.installNamespaceDropdownFilter(testName);
    await operatorHubView.installNamespaceDropdownSelect(testName).click();

    await operatorHubView.createSubscriptionFormBtn.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('installState-installed');

    expect(catalogPageView.catalogTileById('etcd-openshift-marketplace').$('.catalog-tile-pf-footer').getText()).toContain('Installed');
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async() => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.catalogTileById('etcd-openshift-marketplace').click();
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.acceptCommunityWarningModal();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(until.visibilityOf(crudView.rowForOperator('etcd')), 30000);
  });

  it('displays button to uninstall the Operator', async() => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('installState-installed');
    await catalogPageView.catalogTileFor('etcd').click();
    await operatorHubView.operatorCommunityWarningIsLoaded();
    await operatorHubView.acceptCommunityWarningModal();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.operatorModalUninstallBtn.click();

    expect(browser.getCurrentUrl()).toContain(`/ns/${testName}/subscriptions/etcd?showDelete=true`);
  });

  it('uninstalls Operator from the cluster', async() => {
    await browser.wait(until.visibilityOf($('.co-catalog-install-modal')));
    await element(by.cssContainingText('#confirm-action', 'Remove')).click();
    await crudView.isLoaded();

    expect(crudView.rowForName('etcd').isPresent()).toBe(false);
  });
});
