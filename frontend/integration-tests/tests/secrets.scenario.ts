/* eslint-disable max-nested-callbacks */
import { $, element, browser, by, ExpectedConditions as until, Key } from 'protractor';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as secretsView from '../views/secrets.view';

describe('Interacting with the create secret forms', () => {

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  describe('Webhook secret', () => {
    const webhookSecretName = 'webhook-secret';
    const webhookSecretValue = 'webhookValue';

    beforeAll(async() => secretsView.visitSecretsPage(appHost, testName));

    it('creates webhook secret', async() => {
      await secretsView.createSecret(secretsView.createWebhookSecretLink, testName, webhookSecretName, async() => {
        await secretsView.webhookSecretValueInput.sendKeys(webhookSecretValue);
      });
    });

    it('check for created webhook secret value', async() => {
      await secretsView.checkSecret(testName, webhookSecretName, {'WebHookSecretKey': webhookSecretValue});
    });

    it('edits webhook secret', async() => {
      await secretsView.editSecret(testName, webhookSecretName, async() => {
        await element(by.buttonText('Generate')).click();
      });
    });

    it('check for edited webhook secret value', async() => {
      await browser.wait(until.textToBePresentInElement($('.co-m-pane__heading'), webhookSecretName));
      await element(by.partialButtonText('Reveal Values')).click();
      expect(secretsView.pre.get(0).getText()).not.toEqual(webhookSecretValue);
    });

    it('deletes the webhook secret', async() => {
      await crudView.deleteResource('secrets', 'Secret', webhookSecretName);
    });
  });

  describe('Basic source secrets', () => {
    const basicSourceSecretName = 'basic-source-secret';
    const basicSourceSecretUsername = 'username';
    const basicSourceSecretUsernameUpdated = 'usernameUpdated';
    const basicSourceSecretPassword = 'password';
    const basicSourceSecretPasswordUpdated = 'passwordUpdated';

    beforeAll(async() => secretsView.visitSecretsPage(appHost, testName));

    it('creates basic source secret', async() => {
      await secretsView.createSecret(secretsView.createSourceSecretLink, testName, basicSourceSecretName, async() => {
        await secretsView.sourceSecretUsernameInput.sendKeys(basicSourceSecretUsername);
        await secretsView.sourceSecretPasswordInput.sendKeys(basicSourceSecretPassword);
      });
    });

    it('check for created basic source secret values', async() => {
      await secretsView.checkSecret(testName, basicSourceSecretName, {'username': basicSourceSecretUsername, 'password': basicSourceSecretPassword});
    });

    it('edits basic source secret', async() => {
      await secretsView.editSecret(testName, basicSourceSecretName, async() => {
        await secretsView.sourceSecretUsernameInput.clear();
        await secretsView.sourceSecretUsernameInput.sendKeys(basicSourceSecretUsernameUpdated);
        await secretsView.sourceSecretPasswordInput.clear();
        await secretsView.sourceSecretPasswordInput.sendKeys(basicSourceSecretPasswordUpdated);
      });
    });

    it('check for edited basic source secret values', async() => {
      await secretsView.checkSecret(testName, basicSourceSecretName, {'username': basicSourceSecretUsernameUpdated, 'password': basicSourceSecretPasswordUpdated});
    });

    it('deletes the basic source secret', async() => {
      await crudView.deleteResource('secrets', 'Secret', basicSourceSecretName);
    });
  });

  describe('SSH source secrets', () => {
    const sshSourceSecretName = 'ssh-source-secret';
    const sshSourceSecretSSHKey = 'sshKey';
    const sshSourceSecretSSHKeUpdated = 'sshKeyUpdated';

    beforeAll(async() => secretsView.visitSecretsPage(appHost, testName));

    it('creates SSH source secret', async() => {
      await secretsView.createSecret(secretsView.createSourceSecretLink, testName, sshSourceSecretName, async() => {
        await secretsView.authTypeDropdown.click().then(() => browser.actions().sendKeys(Key.ARROW_UP, Key.ENTER).perform());
        await browser.wait(until.presenceOf(secretsView.sourceSecretSSHTextArea));
        await secretsView.sourceSecretSSHTextArea.sendKeys(sshSourceSecretSSHKey);
      });
    });

    it('check for created SSH source secret values', async() => {
      await secretsView.checkSecret(testName, sshSourceSecretName, {'ssh-privatekey': sshSourceSecretSSHKey});
    });

    it('edits SSH source secret', async() => {
      await secretsView.editSecret(testName, sshSourceSecretName, async() => {
        await browser.wait(until.presenceOf(secretsView.sourceSecretSSHTextArea));
        await secretsView.sourceSecretSSHTextArea.clear();
        await secretsView.sourceSecretSSHTextArea.sendKeys(sshSourceSecretSSHKeUpdated);
      });
    });

    it('check for edited SSH source secret values', async() => {
      await secretsView.checkSecret(testName, sshSourceSecretName, {'ssh-privatekey': sshSourceSecretSSHKeUpdated});
    });

    it('deletes the SSH source secret', async() => {
      await crudView.deleteResource('secrets', 'Secret', sshSourceSecretName);
    });
  });
});
