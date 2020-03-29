import { $, browser, by, element, ExpectedConditions as until } from 'protractor';
import * as _ from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';

describe('CRD extensions', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  describe('ConsoleClIDownload CRD', () => {
    const crd = 'ConsoleCLIDownload';
    const name = `${testName}-ccd`;
    // cannot use default YAML template since it contains new lines
    // in the description and that breaks with safeLoad
    const crdObj = {
      apiVersion: 'console.openshift.io/v1',
      kind: crd,
      metadata: {
        name,
      },
      spec: {
        displayName: name,
        description:
          'This is an example CLI download description that can include markdown such as paragraphs, unordered lists, code, [links](https://www.example.com), etc.',
        links: [{ href: 'https://www.example.com', text: 'Example CLI Download' }],
      },
    };

    it(`displays YAML editor for creating a new ${crd} instance`, async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
      await crudView.isLoaded();
      await crudView.clickKebabAction(crd, 'View Instances');
      await crudView.isLoaded();
      await crudView.clickCreateWithYAML();
      await yamlView.isLoaded();
      await yamlView.setEditorContent(safeDump(crdObj));
      expect(yamlView.getEditorContent()).toContain(`kind: ${crd}`);
    });

    it(`creates a new ${crd} instance`, async () => {
      await yamlView.saveButton.click();
      expect(crudView.errorMessage.isPresent()).toBe(false);
    });

    it(`displays detail view for ${crd} instance`, async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain(`/${name}`);
      expect(crudView.resourceTitle.getText()).toEqual(name);
    });

    it(`displays the ${crd} instance on the Command Line Tools page`, async () => {
      await browser.get(`${appHost}/command-line-tools`);
      await browser.wait(until.presenceOf($(`[data-test-id=${name}]`)));
      expect($(`[data-test-id=${name}]`).getText()).toEqual(name);
    });

    it(`deletes the ${crd} instance`, async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
      await crudView.isLoaded();
      await crudView.clickKebabAction(crd, 'View Instances');
      await crudView.resourceRowsPresent();
      // cannot use `await crudView.deleteRow(crd)(name)` because ConsoleCLIDownload is humanized as 'Console C L I Download';
      await crudView.clickKebabAction(name, 'Delete Console CLI Download');
      await browser.wait(until.presenceOf($('#confirm-action')));
      await $('#confirm-action').click();
    });
  });

  describe('ConsoleLink CRD', () => {
    const crd = 'ConsoleLink';
    const name = `${testName}-cl`;
    const testObjs = [
      {
        name,
        dropdownMenuName: 'help menu',
        dropdownToggle: $('[data-test=help-dropdown-toggle] .pf-c-app-launcher__toggle'),
        menuLinkLocation: 'HelpMenu',
        menuLinkText: `${name} help menu link`,
      },
      {
        name,
        dropdownMenuName: 'user menu',
        dropdownToggle: $('[data-test=user-dropdown] .pf-c-app-launcher__toggle'),
        menuLinkLocation: 'UserMenu',
        menuLinkText: `${name} user menu link`,
      },
    ];

    testObjs.forEach(
      ({
        name: instanceName,
        dropdownMenuName,
        dropdownToggle,
        menuLinkLocation,
        menuLinkText,
      }) => {
        it(`displays YAML editor for creating a new ${crd} ${dropdownMenuName} instance`, async () => {
          await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
          await crudView.isLoaded();
          await crudView.clickKebabAction(crd, 'View Instances');
          await crudView.isLoaded();
          await crudView.clickCreateWithYAML();
          await yamlView.isLoaded();
          const content = await yamlView.getEditorContent();
          const newContent = _.defaultsDeep(
            {},
            {
              metadata: { name: instanceName },
              spec: { location: menuLinkLocation, text: menuLinkText },
            },
            safeLoad(content),
          );
          await yamlView.setEditorContent(safeDump(newContent));
          expect(yamlView.getEditorContent()).toContain(`kind: ${crd}`);
        });

        it(`creates a new ${crd} ${dropdownMenuName} instance`, async () => {
          await yamlView.saveButton.click();
          expect(crudView.errorMessage.isPresent()).toBe(false);
        });

        it(`displays detail view for ${crd} ${dropdownMenuName} instance`, async () => {
          await browser.wait(until.presenceOf(crudView.resourceTitle));
          expect(browser.getCurrentUrl()).toContain(`/${instanceName}`);
          expect(crudView.resourceTitle.getText()).toEqual(instanceName);
        });

        it(`displays the ${crd} instance in the ${dropdownMenuName}`, async () => {
          await browser.get(`${appHost}`);
          // reload the app so the new CRD link is visible
          await browser.refresh();
          await browser.wait(until.presenceOf(dropdownToggle));
          await browser.wait(dropdownToggle.click());
          await browser.wait(
            until.presenceOf(
              element(by.cssContainingText('.pf-c-app-launcher__menu-item', menuLinkText)),
            ),
          );
          expect(
            element(by.cssContainingText('.pf-c-app-launcher__menu-item', menuLinkText)).getText(),
          ).toContain(menuLinkText);
        });

        it(`deletes the ${crd} ${dropdownMenuName} instance`, async () => {
          await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
          await crudView.isLoaded();
          await crudView.clickKebabAction(crd, 'View Instances');
          await crudView.resourceRowsPresent();
          await crudView.deleteRow(crd)(instanceName);
        });
      },
    );
  });

  describe('ConsoleNotification CRD', () => {
    const crd = 'ConsoleNotification';
    const name = `${testName}-cn`;
    let location = 'BannerTop';
    let text = `${name} notification that appears ${location}`;
    let notification = $(`[data-test=${name}-${location}]`);

    it(`displays YAML editor for creating a new ${crd} instance`, async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
      await crudView.isLoaded();
      await crudView.clickKebabAction(crd, 'View Instances');
      await crudView.isLoaded();
      await crudView.clickCreateWithYAML();
      await yamlView.isLoaded();
      const content = await yamlView.getEditorContent();
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name }, spec: { location, text } },
        safeLoad(content),
      );
      await yamlView.setEditorContent(safeDump(newContent));
      expect(yamlView.getEditorContent()).toContain(`kind: ${crd}`);
    });

    it(`creates a new ${crd} instance`, async () => {
      await yamlView.saveButton.click();
      expect(crudView.errorMessage.isPresent()).toBe(false);
    });

    it(`displays detail view for ${crd} instance`, async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain(`/${name}`);
      expect(crudView.resourceTitle.getText()).toEqual(name);
    });

    it(`displays the ${crd} instance`, async () => {
      await browser.wait(until.presenceOf(notification));
      expect(notification.getText()).toContain(text);
    });

    it(`displays YAML editor for modifying the location of ${crd} instance`, async () => {
      location = 'BannerBottom';
      text = `${name} notification that appears ${location}`;
      await browser.getCurrentUrl().then((url) => browser.get(`${url}/yaml`));
      await yamlView.isLoaded();
      const content = await yamlView.getEditorContent();
      const newContent = _.defaultsDeep({}, { spec: { location, text } }, safeLoad(content));
      await yamlView.setEditorContent(safeDump(newContent));
      expect(yamlView.getEditorContent()).toContain(`location: ${location}`);
      await yamlView.saveButton.click();
      await browser.wait(until.visibilityOf(crudView.successMessage));
      expect(crudView.successMessage.isPresent()).toBe(true);
    });

    it(`displays the ${crd} instance in its new location`, async () => {
      location = 'BannerBottom';
      notification = $(`[data-test=${name}-${location}]`);
      text = `${name} notification that appears ${location}`;
      await browser.wait(until.presenceOf(notification));
      expect(notification.getText()).toContain(text);
    });

    it(`deletes the ${crd} instance`, async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
      await crudView.isLoaded();
      await crudView.clickKebabAction(crd, 'View Instances');
      await crudView.resourceRowsPresent();
      await crudView.deleteRow(crd)(name);
    });
  });

  describe('ConsoleExternalLogLink CRD', () => {
    const crd = 'ConsoleExternalLogLink';
    const name = `${testName}-cell`;
    const podName = `${testName}-pod`;
    const cell = $(`[data-test-id=${name}]`);
    const text = `${name} Logs`;
    const namespaceFilter = '^openshift-';

    it(`displays YAML editor for creating a new ${crd} instance`, async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
      await crudView.isLoaded();
      await crudView.clickKebabAction(crd, 'View Instances');
      await crudView.isLoaded();
      await crudView.clickCreateWithYAML();
      await yamlView.isLoaded();
      const content = await yamlView.getEditorContent();
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name }, spec: { text } },
        safeLoad(content),
      );
      await yamlView.setEditorContent(safeDump(newContent));
      expect(yamlView.getEditorContent()).toContain(`kind: ${crd}`);
    });

    it(`creates a new ${crd} instance`, async () => {
      await yamlView.saveButton.click();
      expect(crudView.errorMessage.isPresent()).toBe(false);
    });

    it(`displays detail view for ${crd} instance`, async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain(`/${name}`);
      expect(crudView.resourceTitle.getText()).toEqual(name);
    });

    it(`creates a new test pod to display the ${crd} instance`, async () => {
      await browser.get(`${appHost}/k8s/ns/${testName}/pods`);
      await crudView.isLoaded();
      await crudView.clickCreateWithYAML();
      await yamlView.isLoaded();
      const content = await yamlView.getEditorContent();
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name: podName, labels: { app: name } } },
        safeLoad(content),
      );
      await yamlView.setEditorContent(safeDump(newContent));
      await yamlView.saveButton.click();
      expect(crudView.errorMessage.isPresent()).toBe(false);
    });

    it(`displays the ${crd} instance on the test pod`, async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      await browser.getCurrentUrl().then((url) => browser.get(`${url}/logs`));
      await browser.wait(until.presenceOf(cell));
      expect(cell.getText()).toContain(text);
    });

    it(`displays YAML editor for adding namespaceFilter to the ${crd} instance`, async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
      await crudView.isLoaded();
      await crudView.clickKebabAction(crd, 'View Instances');
      await crudView.resourceRowsPresent();
      await crudView.editRow(crd)(name);
      await yamlView.isLoaded();
      const content = await yamlView.getEditorContent();
      const newContent = _.defaultsDeep({}, { spec: { namespaceFilter } }, safeLoad(content));
      await yamlView.setEditorContent(safeDump(newContent));
      expect(yamlView.getEditorContent()).toContain(`namespaceFilter: ${namespaceFilter}`);
      await yamlView.saveButton.click();
      await browser.wait(until.visibilityOf(crudView.successMessage));
      expect(crudView.successMessage.isPresent()).toBe(true);
    });

    it(`does not display the ${crd} instance on the test pod`, async () => {
      await browser.get(`${appHost}/k8s/ns/${testName}/pods/${podName}/logs`);
      await crudView.isLoaded();
      expect(cell.isPresent()).toBe(false);
    });

    it('deletes the test pod', async () => {
      await browser.get(`${appHost}/k8s/ns/${testName}/pods?name=${podName}`);
      await crudView.isLoaded();
      await crudView.deleteRow('Pod')(podName);
    });

    it(`deletes the ${crd} instance`, async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${crd}`);
      await crudView.isLoaded();
      await crudView.clickKebabAction(crd, 'View Instances');
      await crudView.resourceRowsPresent();
      await crudView.deleteRow(crd)(name);
    });
  });
});
