import { $, element, browser, by, ExpectedConditions as until } from 'protractor';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as secretsView from '../views/secrets.view';

const SECRET_NAME = `secret-${testName}`;

describe('Interacting with the create secret forms', () => {

  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/secrets`);
    await crudView.isLoaded();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/secrets`);
    await crudView.isLoaded();
    await crudView.filterForName(testName);
    await crudView.resourceRowsPresent();
    await crudView.deleteRow('secret')(SECRET_NAME);
    checkLogs();
    checkErrors();
  });

  describe('Webhook secrets', () => {

    it('creates webhook secret', async() => {
      await crudView.createItemButton.click();
      await secretsView.createWebhookSecretLink.click();
      await secretsView.secretNameInput.sendKeys(SECRET_NAME);
      await secretsView.webhookSecretValueInput.sendKeys(secretsView.webhookSecretValue);
      await secretsView.saveButton.click();
      expect(secretsView.errorMessage.isPresent()).toBe(false);
    });

    it('check for created webhook secret value', async() => {
      await browser.wait(until.textToBePresentInElement($('.co-m-pane__heading'), SECRET_NAME));
      await element(by.partialButtonText('Reveal Values')).click();
      expect(secretsView.pre.get(0).getText()).toEqual(secretsView.webhookSecretValue);
    });

    it('edits webhook secret', async() => {
      await crudView.actionsDropdown.click();
      await browser.wait(until.presenceOf(crudView.actionsDropdownMenu), 500);
      await crudView.actionsDropdownMenu.element(by.linkText('Edit Secret')).click();
      await browser.wait(until.urlContains(`/k8s/ns/${testName}/secrets/${SECRET_NAME}/edit`));
      await element(by.buttonText('Generate')).click();
      await secretsView.saveButton.click();
      expect(secretsView.errorMessage.isPresent()).toBe(false);
    });

    it('check for edited webhook secret value', async() => {
      await browser.wait(until.textToBePresentInElement($('.co-m-pane__heading'), SECRET_NAME));
      await element(by.partialButtonText('Reveal Values')).click();
      expect(secretsView.pre.get(0).getText()).not.toEqual(secretsView.webhookSecretValue);
    });
  });
});
