import { browser, ExpectedConditions as until } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as environmentView from '../views/environment.view';
import * as yamlView from '../views/yaml.view';

const BROWSER_TIMEOUT = 15000;
const WORKLOAD_NAME = `env-${testName}`;
const Actions = {
  add: 'add',
  delete: 'delete',
};

describe('Interacting with the environment variable editor', () => {

  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets`);
    await crudView.isLoaded();
    await crudView.createYAMLButton.click();
    await yamlView.isLoaded();
    const content = await yamlView.editorContent.getText();
    const newContent = _.defaultsDeep({}, {metadata: {name: WORKLOAD_NAME, labels: {['lbl-env']: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));
    await crudView.saveChangesBtn.click();
    // Wait until the resource is created and the details page loads before continuing.
    await browser.wait(until.presenceOf(crudView.actionsDropdown));
    checkLogs();
    checkErrors();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets`);
    await crudView.isLoaded();
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    await crudView.deleteRow('daemonset')(WORKLOAD_NAME);
    checkLogs();
    checkErrors();
  });

  const validateKeyAndValue = async(
    key: string,
    value: string,
    isPresent: boolean
  ) => {
    let keyFound = 0;

    const envKey = await environmentView.rowsKey.getAttribute('value');
    const envValue = await environmentView.rowsValue.getAttribute('value');

    if (envKey === key){
      keyFound = keyFound + 1;
      expect( envValue ).toBe(value);
    }

    if (isPresent){
      expect(keyFound).toEqual(1);
    } else {
      expect(keyFound).toEqual(0);
    }
  };

  const environmentEditor = async(
    action: string,
    key: string,
    value: string
  ) => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets/${WORKLOAD_NAME}/environment`);

    switch (action) {
      case Actions.add: {
        await environmentView.addVariable(key, value);
        break;
      }
      case Actions.delete: {
        await environmentView.deleteVariable();
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
    it('shows the correct variables', async() => {
      const key = 'KEY';
      const value = 'value';

      await environmentEditor(Actions.add, key, value);
      await environmentView.isLoaded();
      await validateKeyAndValue(key, value, true);
    });
  });

  describe('When a variable is deleted', () => {
    it('does not show any variables', async() => {
      const key = 'KEY';
      const value = 'value';
      await environmentEditor(Actions.delete, key, value);
      await environmentView.isLoaded();
      await validateKeyAndValue(key, value, false);
    });
  });
});
