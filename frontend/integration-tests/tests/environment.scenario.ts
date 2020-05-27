import { browser, ExpectedConditions as until } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as environmentView from '../views/environment.view';
import * as yamlView from '../views/yaml.view';
import { execSync } from 'child_process';

const BROWSER_TIMEOUT = 15000;
const WORKLOAD_NAME = `env-${testName}`;
const Actions = {
  add: 'add',
  delete: 'delete',
  deleteFrom: 'deleteFrom',
  addFrom: 'addFrom',
};

describe('Interacting with the environment variable editor', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
    await crudView.isLoaded();
    await crudView.createYAMLButton.click();
    await yamlView.isLoaded();
    const content = await yamlView.getEditorContent();
    const newContent = _.defaultsDeep(
      {},
      { metadata: { name: WORKLOAD_NAME, labels: { ['lbl-env']: testName } } },
      safeLoad(content),
    );
    await yamlView.setEditorContent(safeDump(newContent));
    await crudView.saveChangesBtn.click();
    // Wait until the resource is created and the details page loads before continuing.
    await browser.wait(until.presenceOf(crudView.actionsButton));
    execSync(
      `oc create cm my-config --from-literal=cmk1=config1 --from-literal=cmk2=config2 -n ${testName}`,
    );
    execSync(
      `oc create secret generic my-secret --from-literal=key1=supersecret --from-literal=key2=topsecret -n ${testName}`,
    );
    checkLogs();
    checkErrors();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
    await crudView.isLoaded();
    await crudView.textFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(
      until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()),
      BROWSER_TIMEOUT,
    );
    await crudView.deleteRow('Deployment')(WORKLOAD_NAME);
    execSync(`oc delete cm my-config -n ${testName}`);
    execSync(`oc delete secret my-secret -n ${testName}`);
    checkLogs();
    checkErrors();
  });

  const present = true;
  const validateKeyAndValue = async (key: string, value: string, isPresent: boolean) => {
    let keyFound = 0;

    const envKey = await environmentView.rowsKey.getAttribute('value');
    const envValue = await environmentView.rowsValue.getAttribute('value');

    if (envKey === key) {
      keyFound = keyFound + 1;
      expect(envValue).toBe(value);
    }

    if (isPresent) {
      expect(keyFound).toEqual(1);
    } else {
      expect(keyFound).toEqual(0);
    }
  };

  const validateValueFrom = async (valueFrom: string, prefix: string, isPresent: boolean) => {
    const resourceText = await environmentView.resources.last().getText();
    const prefixText = await environmentView.prefix.getAttribute('value');
    if (isPresent) {
      expect(resourceText).toEqual(valueFrom);
      expect(prefixText).toEqual(prefix);
    } else {
      expect(resourceText).toEqual('hello-openshift');
      expect(prefixText).toEqual('');
    }
  };

  const environmentEditor = async (action: string, key: string, value: string) => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments/${WORKLOAD_NAME}/environment`);

    switch (action) {
      case Actions.add: {
        await environmentView.addVariable(key, value);
        break;
      }
      case Actions.delete: {
        await environmentView.deleteVariable();
        break;
      }
      case Actions.deleteFrom: {
        await environmentView.deleteFromVariable();
        break;
      }
      case Actions.addFrom: {
        await environmentView.addVariableFrom(key, value);
        break;
      }
      default: {
        throw new Error(`Invalid action [${action}]`);
      }
    }

    await environmentView.isLoaded();
    await crudView.isLoaded();
  };

  describe('When a variable is added', () => {
    it('shows the correct variables', async () => {
      const key = 'KEY';
      const value = 'value';
      await environmentEditor(Actions.add, key, value);
      await environmentView.isLoaded();
      await validateKeyAndValue(key, value, present);
    });
  });

  describe('When a variable is deleted', () => {
    it('does not show any variables', async () => {
      const key = 'KEY';
      const value = 'value';
      await environmentEditor(Actions.delete, key, value);
      await environmentView.isLoaded();
      await validateKeyAndValue(key, value, !present);
    });
  });

  describe('When a variable is added from a config map', () => {
    it('shows the correct variables', async () => {
      const resourceName = 'my-config';
      const envPrefix = 'testcm';
      await environmentEditor(Actions.addFrom, resourceName, envPrefix);
      await environmentView.isLoaded();
      await validateValueFrom(resourceName, envPrefix, present);
    });
  });

  describe('When a variable is deleted from a config map', () => {
    it('shows the correct variables', async () => {
      const resourceName = 'my-config';
      const envPrefix = 'testcm';
      await environmentEditor(Actions.deleteFrom, resourceName, envPrefix);
      await environmentView.isLoaded();
      await validateValueFrom(resourceName, envPrefix, !present);
    });
  });

  describe('When a variable is added from a secret', () => {
    it('shows the correct variables', async () => {
      const resourceName = 'my-secret';
      const envPrefix = 'testsecret';
      await environmentEditor(Actions.addFrom, resourceName, envPrefix);
      await environmentView.isLoaded();
      await validateValueFrom(resourceName, envPrefix, true);
    });
  });

  describe('When a variable is deleted from a secret', () => {
    it('shows the correct variables', async () => {
      const resourceName = 'my-secret';
      const envPrefix = 'testsecret';
      await environmentEditor(Actions.deleteFrom, resourceName, envPrefix);
      await environmentView.isLoaded();
      await validateValueFrom(resourceName, envPrefix, false);
    });
  });
});
