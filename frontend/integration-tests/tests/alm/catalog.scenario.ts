/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, by, ExpectedConditions as until } from 'protractor';

import { appHost } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';

describe('Installing Vault OCS from catalog', () => {
  const testNamespace = `alm-e2e-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;
  const deleteRecoveryTime = 300000;

  beforeAll(async() => {
    // Create test namespace
    await browser.get(`${appHost}/namespaces`);
    await crudView.isLoaded();
    await crudView.createYAMLButton.click();
    await browser.wait(until.presenceOf($('.modal-body__field')));
    await $$('.modal-body__field').get(0).$('input').sendKeys(testNamespace);
    await $('#confirm-delete').click();
    await browser.sleep(500);

    expect(browser.getCurrentUrl()).toContain(`/namespaces/${testNamespace}`);
  });

  afterAll(async() => {
    // Destroy test namespace
    await browser.get(`${appHost}/namespaces`);
    await crudView.isLoaded();
    await crudView.deleteRow('Namespace')(testNamespace);
  }, deleteRecoveryTime);

  it('displays `Applications` tab in navigation sidebar', async() => {
    expect(sidenavView.navSectionFor('Applications').isDisplayed()).toBe(true);
  });

  it('displays Open Cloud Catalog with three available services', async() => {
    await sidenavView.clickNavLink(['Applications', 'Open Cloud Catalog']);
    await catalogView.isLoaded();

    expect(catalogView.entryRows.count()).toEqual(3);
    expect(catalogView.entryRowFor('Vault').isDisplayed()).toBe(true);
    expect(catalogView.entryRowFor('etcd').isDisplayed()).toBe(true);
    expect(catalogView.entryRowFor('Prometheus').isDisplayed()).toBe(true);
  });

  it('displays available namespaces for service to be enabled in', async() => {
    await catalogView.entryRowFor('Vault').element(by.buttonText('Enable')).click();
    await browser.wait(until.presenceOf(catalogView.enableModal));
    await catalogView.selectNamespaceRowFor(testNamespace).click();

    expect(catalogView.selectNamespaceRowFor(testNamespace).getText()).toContain('Will be enabled');
  });

  it('enables Vault and etcd in the selected namespace', async() => {
    await catalogView.enableModal.element(by.buttonText('Enable')).click();
    await browser.wait(until.invisibilityOf(catalogView.enableModal));
    await browser.sleep(500);
    await catalogView.entryRowFor('Vault').$('a').click();
    await catalogView.entryRowFor('etcd').$('a').click();
    await browser.wait(until.visibilityOf(catalogView.detailedBreakdownFor('Vault')));
    await browser.wait(until.visibilityOf(catalogView.detailedBreakdownFor('etcd')));

    expect(catalogView.namespaceEnabledFor('Vault')(testNamespace)).toBe(true);
    expect(catalogView.namespaceEnabledFor('etcd')(testNamespace)).toBe(true);
  });

  it('displays namespaces where the service can be disabled', async() => {
    await catalogView.entryRowFor('Vault').element(by.buttonText('Disable')).click();
    await browser.wait(until.presenceOf(catalogView.disableModal));
    await catalogView.selectNamespaceRowFor(testNamespace).click();

    expect(catalogView.selectNamespaceRowFor(testNamespace).getText()).toContain('To be disabled');
  });

  it('displays option to delete all related resources when disabling an application from a namespace', async() => {
    expect(catalogView.disableModal.$('.co-delete-modal-checkbox-label').$('input').isSelected()).toBe(true);
  });

  it('removes the namespace from the list of enabled namespaces for the selected application', async() => {
    await catalogView.enableModal.element(by.buttonText('Disable')).click();
    await browser.wait(until.invisibilityOf(catalogView.enableModal));
    await browser.sleep(500);
    await catalogView.entryRowFor('Vault').$('a').click();
    await browser.wait(until.visibilityOf(catalogView.detailedBreakdownFor('Vault')));
    expect(catalogView.namespaceEnabledFor('Vault')(testNamespace)).toBe(false);
  });
});
