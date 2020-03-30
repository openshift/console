/* eslint-disable max-nested-callbacks */
import { $, $$, element, browser, by, ExpectedConditions as until } from 'protractor';
import { execSync } from 'child_process';

import { appHost, testName, checkLogs, checkErrors, waitForCount } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as secretsView from '../views/secrets.view';
import { DeploymentKind } from '../../public/module/k8s';

describe('Interacting with the create secret forms', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  describe('Webhook secret', () => {
    const webhookSecretName = 'webhook-secret';
    const webhookSecretValue = 'webhookValue';

    beforeAll(async () => secretsView.visitSecretsPage(appHost, testName));

    it('creates webhook secret', async () => {
      await secretsView.createSecret(
        secretsView.createWebhookSecretLink,
        testName,
        webhookSecretName,
        async () => {
          await secretsView.secretWebhookInput.sendKeys(webhookSecretValue);
        },
      );
    });

    it('check for created webhook secret value', async () => {
      await secretsView.checkSecret(testName, webhookSecretName, {
        WebHookSecretKey: webhookSecretValue,
      });
    });

    it('edits webhook secret', async () => {
      await secretsView.editSecret(testName, webhookSecretName, async () => {
        await element(by.buttonText('Generate')).isPresent();
        await element(by.buttonText('Generate')).click();
      });
    });

    it('check for edited webhook secret value', async () => {
      await browser.wait(
        until.textToBePresentInElement($('.co-m-pane__heading'), webhookSecretName),
      );
      await secretsView.clickRevealValues();
      expect(secretsView.pre.get(0).getText()).not.toEqual(webhookSecretValue);
    });

    it('deletes the webhook secret', async () => {
      await crudView.deleteResource('secrets', 'Secret', webhookSecretName);
    });
  });

  describe('Basic source secrets', () => {
    const basicSourceSecretName = 'basic-source-secret';
    const basicSourceSecretUsername = 'username';
    const basicSourceSecretUsernameUpdated = 'usernameUpdated';
    const basicSourceSecretPassword = 'password';
    const basicSourceSecretPasswordUpdated = 'passwordUpdated';

    beforeAll(async () => secretsView.visitSecretsPage(appHost, testName));

    it('creates basic source secret', async () => {
      await secretsView.createSecret(
        secretsView.createSourceSecretLink,
        testName,
        basicSourceSecretName,
        async () => {
          await secretsView.secretUsernameInput.sendKeys(basicSourceSecretUsername);
          await secretsView.secretPasswordInput.sendKeys(basicSourceSecretPassword);
        },
      );
    });

    it('check for created basic source secret values', async () => {
      await secretsView.checkSecret(testName, basicSourceSecretName, {
        username: basicSourceSecretUsername,
        password: basicSourceSecretPassword,
      });
    });

    it('edits basic source secret', async () => {
      await secretsView.editSecret(testName, basicSourceSecretName, async () => {
        await secretsView.secretUsernameInput.clear();
        await secretsView.secretUsernameInput.sendKeys(basicSourceSecretUsernameUpdated);
        await secretsView.secretPasswordInput.clear();
        await secretsView.secretPasswordInput.sendKeys(basicSourceSecretPasswordUpdated);
      });
    });

    it('check for edited basic source secret values', async () => {
      await secretsView.checkSecret(testName, basicSourceSecretName, {
        username: basicSourceSecretUsernameUpdated,
        password: basicSourceSecretPasswordUpdated,
      });
    });

    it('deletes the basic source secret', async () => {
      await crudView.deleteResource('secrets', 'Secret', basicSourceSecretName);
    });
  });

  describe('SSH source secrets', () => {
    const sshSourceSecretName = 'ssh-source-secret';
    const sshSourceSecretSSHKey = 'sshKey';
    const sshSourceSecretSSHKeUpdated = 'sshKeyUpdated';

    beforeAll(async () => secretsView.visitSecretsPage(appHost, testName));

    it('creates SSH source secret', async () => {
      await secretsView.createSecret(
        secretsView.createSourceSecretLink,
        testName,
        sshSourceSecretName,
        async () => {
          await secretsView.authTypeDropdown.click();
          await secretsView.authSSHOption.click();
          await browser.wait(until.presenceOf(secretsView.uploadFileTextArea));
          await secretsView.uploadFileTextArea.sendKeys(sshSourceSecretSSHKey);
        },
      );
    });

    it('check for created SSH source secret values', async () => {
      await secretsView.checkSecret(testName, sshSourceSecretName, {
        'ssh-privatekey': sshSourceSecretSSHKey,
      });
    });

    it('edits SSH source secret', async () => {
      await secretsView.editSecret(testName, sshSourceSecretName, async () => {
        await secretsView.uploadFileTextArea.clear();
        await secretsView.uploadFileTextArea.sendKeys(sshSourceSecretSSHKeUpdated);
      });
    });

    it('check for edited SSH source secret values', async () => {
      await secretsView.checkSecret(testName, sshSourceSecretName, {
        'ssh-privatekey': sshSourceSecretSSHKeUpdated,
      });
    });

    it('deletes the SSH source secret', async () => {
      await crudView.deleteResource('secrets', 'Secret', sshSourceSecretName);
    });
  });

  describe('Registry credentials image secrets', () => {
    const credentialsImageSecretName = 'registry-credentials-image-secret';
    const address = 'https://index.openshift.io/v';
    const addressUpdated = 'https://index.openshift.io/updated/v1';
    const username = 'username';
    const password = 'password';
    const username0 = 'username0';
    const password0 = 'password0';
    const username1 = 'username1';
    const password1 = 'password1';
    const usernameUpdated = 'usernameUpdated';
    const passwordUpdated = 'passwordUpdated';
    const mail = 'test@secret.com';
    const mailUpdated = 'testUpdated@secret.com';

    const credentialsToCheck = {
      '.dockerconfigjson': {
        auths: {
          'https://index.openshift.io/v0': {
            username: username0,
            password: password0,
            auth: secretsView.encode(username0, password0),
            email: 'test@secret.com0',
          },
          'https://index.openshift.io/v1': {
            username: username1,
            password: password1,
            auth: secretsView.encode(username1, password1),
            email: 'test@secret.com1',
          },
        },
      },
    };
    const updatedCredentialsToCheck = {
      '.dockerconfigjson': {
        auths: {
          'https://index.openshift.io/updated/v1': {
            username: usernameUpdated,
            password: passwordUpdated,
            auth: secretsView.encode(usernameUpdated, passwordUpdated),
            email: 'testUpdated@secret.com',
          },
        },
      },
    };

    beforeAll(async () => secretsView.visitSecretsPage(appHost, testName));

    it('creates registry credentials image secret', async () => {
      await secretsView.createSecret(
        secretsView.createImageSecretLink,
        testName,
        credentialsImageSecretName,
        async () => {
          await browser.wait(
            until.and(
              crudView.untilNoLoadersPresent,
              until.presenceOf(secretsView.addSecretEntryLink),
            ),
          );
          await secretsView.addSecretEntryLink.click();
          await secretsView.imageSecretForm.each(async (el, index) => {
            await el.$('input[name=address]').sendKeys(address + index);
            await el.$('input[name=username]').sendKeys(username + index);
            await el.$('input[name=password]').sendKeys(password + index);
            await el.$('input[name=email]').sendKeys(mail + index);
          });
        },
      );
    });

    it('check for created registry credentials image secret values', async () => {
      await secretsView.checkSecret(testName, credentialsImageSecretName, credentialsToCheck, true);
    });

    it('edits registry credentials image secret', async () => {
      await secretsView.editSecret(testName, credentialsImageSecretName, async () => {
        await secretsView.removeSecretEntryLink.click();
        await secretsView.secretAddressInput.clear();
        await secretsView.secretAddressInput.sendKeys(addressUpdated);
        await secretsView.secretUsernameInput.clear();
        await secretsView.secretUsernameInput.sendKeys(usernameUpdated);
        await secretsView.secretPasswordInput.clear();
        await secretsView.secretPasswordInput.sendKeys(passwordUpdated);
        await secretsView.secretEmailInput.clear();
        await secretsView.secretEmailInput.sendKeys(mailUpdated);
      });
    });

    it('check for edited registry credentials image secret value', async () => {
      await secretsView.checkSecret(
        testName,
        credentialsImageSecretName,
        updatedCredentialsToCheck,
        true,
      );
    });

    it('deletes the registry credentials image secret', async () => {
      await crudView.deleteResource('secrets', 'Secret', credentialsImageSecretName);
    });
  });

  describe('Upload configuration file image secret', () => {
    const uploadConfigFileImageSecretName = 'upload-configuration-file-image-secret';
    const username = 'username';
    const password = 'password';
    const configFile = {
      auths: {
        'https://index.openshift.io/v1': {
          username,
          password,
          auth: secretsView.encode(username, password),
          email: 'test@secret.com',
        },
      },
    };

    beforeAll(async () => secretsView.visitSecretsPage(appHost, testName));

    it('creates image secret by uploading configuration file', async () => {
      await secretsView.createSecret(
        secretsView.createImageSecretLink,
        testName,
        uploadConfigFileImageSecretName,
        async () => {
          await secretsView.authTypeDropdown.click();
          await secretsView.authConfigFileOption.click();
          await browser.wait(until.presenceOf(secretsView.uploadFileTextArea));
          await secretsView.uploadFileTextArea.sendKeys(JSON.stringify(configFile));
        },
      );
    });

    it('check for created image secret values from uploaded configuration file', async () => {
      await secretsView.checkSecret(
        testName,
        uploadConfigFileImageSecretName,
        { '.dockerconfigjson': configFile },
        true,
      );
    });

    it('deletes the image secret created from uploaded configuration file', async () => {
      await crudView.deleteResource('secrets', 'Secret', uploadConfigFileImageSecretName);
    });
  });

  describe('Key/Value secrets', () => {
    const keyValueSecretName = 'key-value-secret';
    const key = 'key';
    const value = 'value';
    const key0 = 'key0';
    const value0 = 'value0';
    const key1 = 'key1';
    const value1 = 'value1';
    const keyUpdated = 'keyUpdated';
    const valueUpdated = 'valueUpdated';

    beforeAll(async () => secretsView.visitSecretsPage(appHost, testName));

    it('creates Key/Value secret', async () => {
      await secretsView.createSecret(
        secretsView.createGenericSecretLink,
        testName,
        keyValueSecretName,
        async () => {
          await browser.wait(
            until.and(
              crudView.untilNoLoadersPresent,
              until.presenceOf(secretsView.addSecretEntryLink),
            ),
          );
          await secretsView.addSecretEntryLink.click();
          await browser.wait(waitForCount($$('.co-file-dropzone__textarea'), 2));
          await secretsView.genericSecretForm.each(async (el, index) => {
            await el.$('input[name=key]').sendKeys(key + index);
            await el.$('.co-file-dropzone__textarea').sendKeys(value + index);
          });
        },
      );
    });

    it('check for created Key/Value secret values', async () => {
      await secretsView.checkSecret(testName, keyValueSecretName, {
        [key0]: value0,
        [key1]: value1,
      });
    });

    it('edits Key/Value secret', async () => {
      await secretsView.editSecret(testName, keyValueSecretName, async () => {
        await secretsView.removeSecretEntryLink.click();
        await secretsView.secretKeyInput.clear();
        await secretsView.secretKeyInput.sendKeys(keyUpdated);
        await secretsView.uploadFileTextArea.clear();
        await secretsView.uploadFileTextArea.sendKeys(valueUpdated);
      });
    });

    it('check for edited Key/Value secret values', async () => {
      await secretsView.checkSecret(testName, keyValueSecretName, { [keyUpdated]: valueUpdated });
    });

    it('deletes the Key/Value secret', async () => {
      await crudView.deleteResource('secrets', 'Secret', keyValueSecretName);
    });
  });
});

describe('Add Secret to Workloads', () => {
  const secretName = 'test-secret';
  const resourceName = 'test-deploy';
  const resourceKind = 'deployment';
  const envPrefix = 'env-';
  const mountPath = '/tmp/testdata';
  const deployment: DeploymentKind = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: resourceName,
      namespace: testName,
    },
    spec: {
      selector: {
        matchLabels: {
          test: 'add-secret-to-workload',
        },
      },
      template: {
        metadata: {
          labels: {
            test: 'add-secret-to-workload',
          },
        },
        spec: {
          containers: [
            {
              name: 'hello-openshift',
              image: 'openshift/hello-openshift',
            },
          ],
        },
      },
    },
  };

  beforeAll(() => {
    // create deployment and secret
    execSync(`echo '${JSON.stringify(deployment)}' | kubectl create -n ${testName} -f -`);
    execSync(
      `kubectl create secret generic ${secretName} --from-literal=key1=supersecret -n ${testName}`,
    );
  });

  beforeEach(async () => secretsView.visitSecretDetailsPage(appHost, testName, secretName));

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  describe('Add Secret to Workloads as Enviroment Variables', () => {
    it('Add Secret to Deployment as Env', async () => {
      await secretsView.addSecretToWorkloadAsEnv(resourceName, envPrefix);
      await new Promise((resolve) =>
        (function checkForValues() {
          const output = secretsView.getResourceJSON(resourceName, testName, resourceKind);
          if (JSON.parse(output).status.observedGeneration === 2) {
            return resolve();
          }
          setTimeout(checkForValues, 2000);
        })(),
      );
      expect(
        secretsView.isValueInJSONPath(
          'spec.template.spec.containers[0].envFrom[0].secretRef.name',
          secretName,
          resourceName,
          testName,
          resourceKind,
        ),
      ).toBe(true);
      expect(
        secretsView.isValueInJSONPath(
          'spec.template.spec.containers[0].envFrom[0].prefix',
          envPrefix,
          resourceName,
          testName,
          resourceKind,
        ),
      ).toBe(true);
    });
  });

  describe('Add Secret to Workloads as Volume', () => {
    it('Add Secret to Deployment as Vol', async () => {
      await secretsView.addSecretToWorkloadAsVol(resourceName, mountPath);
      await new Promise((resolve) =>
        (function checkForValues() {
          const output = secretsView.getResourceJSON(resourceName, testName, resourceKind);
          if (JSON.parse(output).status.observedGeneration === 3) {
            return resolve();
          }
          setTimeout(checkForValues, 2000);
        })(),
      );
      expect(
        secretsView.isValueInJSONPath(
          'spec.template.spec.containers[0].volumeMounts[0].name',
          secretName,
          resourceName,
          testName,
          resourceKind,
        ),
      ).toBe(true);
      expect(
        secretsView.isValueInJSONPath(
          'spec.template.spec.containers[0].volumeMounts[0].mountPath',
          mountPath,
          resourceName,
          testName,
          resourceKind,
        ),
      ).toBe(true);
    });
  });
});
