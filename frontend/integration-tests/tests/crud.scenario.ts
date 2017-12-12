/* eslint-disable no-undef, no-unused-vars, no-console */

import { browser, $, $$, by, ExpectedConditions as until, Key } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';

import { appHost } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';
import * as loginView from '../views/login.view';

describe('Kubernetes resource CRUD operations', () => {
  const testNamespace = `crud-e2e-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;
  const testResourceName = `crud-e2e-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;
  const testLabel = 'automatedTestName';
  const k8sObjs = new Map<string, string>()
    .set('pods', 'Pod')
    .set('services', 'Service')
    .set('serviceaccounts', 'ServiceAccount')
    .set('secrets', 'Secret')
    .set('configmaps', 'ConfigMap')
    .set('persistentvolumes', 'PersistentVolume')
    .set('ingresses', 'Ingress')
    .set('cronjobs', 'CronJob')
    .set('jobs', 'Job')
    .set('daemonsets', 'DaemonSet')
    .set('deployments', 'Deployment')
    .set('replicasets', 'ReplicaSet')
    .set('replicationcontrollers', 'ReplicationController')
    .set('persistentvolumeclaims', 'PersistentVolumeClaim')
    .set('statefulsets', 'StatefulSet')
    .set('resourcequotas', 'ResourceQuota')
    .set('networkpolicies', 'NetworkPolicy')
    .set('roles', 'Role');

  beforeAll(async() => {
    const {BRIDGE_AUTH_USERNAME, BRIDGE_AUTH_PASSWORD} = process.env;
    if (BRIDGE_AUTH_USERNAME && BRIDGE_AUTH_PASSWORD) {
      await browser.get(appHost);
      await browser.wait(until.visibilityOf(loginView.nameInput));
      await loginView.nameInput.sendKeys(BRIDGE_AUTH_USERNAME);
      await loginView.passwordInput.sendKeys(BRIDGE_AUTH_PASSWORD);
      await loginView.submitButton.click();
      await browser.wait(until.visibilityOf($('#logo')));
    }

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

  beforeEach(async() => {
    await browser.executeScript('window.windowErrors = []');
  });

  afterAll(async() => {
    // Destroy test namespace
    await browser.get(`${appHost}/namespaces`);
    await crudView.isLoaded();
    await crudView.deleteRow('Namespace')(testNamespace);

    console.log('BEGIN BROWSER LOGS');
    (await browser.manage().logs().get('browser')).forEach(log => {
      const {level, message} = log;
      const messageStr = _.isArray(message) ? message.join(' ') : message;
      switch (level.name) {
        case 'DEBUG':
          console.log(level, messageStr);
          break;
        case 'SEVERE':
          console.warn(level, messageStr);
          break;
        case 'INFO':
        default:
          console.info(level, messageStr);
      }
    });
    console.log('END BROWSER LOGS');
  });

  afterEach(async() => {
    (await browser.executeScript('return window.windowErrors || []') as any[]).forEach(error => fail(error));

    // TODO(alecmerdler): Count leaked resources (not properly deleted)
  });

  k8sObjs.forEach((kind, resource) => {

    xdescribe(kind, () => {

      it('displays a list view for the resource', async() => {
        await browser.get(`${appHost}/ns/${testNamespace}/${resource}?name=${testResourceName}`);
        await crudView.isLoaded();
      });

      it('displays a YAML editor for creating a new resource instance', async() => {
        await crudView.createYAMLButton.click();
        await yamlView.isLoaded();

        const content = await yamlView.editorContent.getText();
        const newContent = _.defaultsDeep({}, {metadata: {name: testResourceName, labels: {[testLabel]: testResourceName}}}, safeLoad(content));
        await yamlView.setContent(safeDump(newContent));

        expect(yamlView.editorContent.getText()).toContain(testResourceName);
      });

      it('creates a new resource instance', async() => {
        await yamlView.saveButton.click();

        expect(yamlView.errorMessage.isPresent()).toBe(false);
      });

      it('displays detail view for new resource instance', async() => {
        await browser.wait(until.presenceOf(crudView.actionsDropdown));

        expect(browser.getCurrentUrl()).toContain(`/${testResourceName}`);
        expect(crudView.resourceTitle.getText()).toEqual(testResourceName);
      });

      it('search view displays created resource instance', async() => {
        await browser.get(`${appHost}/ns/${testNamespace}/search?kind=${kind}&q=${testLabel}%3d${testResourceName}`);
        await crudView.isLoaded();
        // FIXME(alecmerdler): `Roles` and `RoleBindings` don't filter using labels
        // await crudView.resourceRows.first().element(by.linkText(testResourceName)).click();
        await crudView.rowForName(testResourceName).element(by.linkText(testResourceName)).click();
        await browser.wait(until.urlContains(`/${testResourceName}`));

        resource !== 'roles' && expect(crudView.resourceTitle.getText()).toEqual(testResourceName);
      });

      it('deletes the resource instance', async() => {
        await browser.get(`${appHost}/ns/${testNamespace}/${resource}`);
        await crudView.isLoaded();
        await crudView.deleteRow(kind)(testResourceName);
      });
    });
  });

  xdescribe('CustomResourceDefinitions', () => {
    const plural = `crd${testResourceName}s`;
    const group = 'test.example.com';
    const name = `${plural}.${group}`;
    const crd = {
      apiVersion: 'apiextensions.k8s.io/v1beta1',
      kind: 'CustomResourceDefinition',
      metadata: {
        name,
        labels: {[testLabel]: testResourceName}
      },
      spec: {
        group,
        version: 'v1',
        names: {
          plural,
          singular: `crd${testResourceName}`,
          kind: `CRD${testResourceName}`,
          shortNames: [testResourceName],
        }
      }
    };

    it('displays `CustomResourceDefinitions` list view', async() => {
      await browser.get(`${appHost}/crds`);
      await crudView.isLoaded();

      expect(crudView.resourceRows.count()).not.toEqual(0);
    });

    it('displays a YAML editor for creating a new custom resource definition', async() => {
      await crudView.createYAMLButton.click();
      await yamlView.isLoaded();
      await yamlView.setContent(safeDump(crd));
      await yamlView.saveButton.click();

      expect(yamlView.errorMessage.isPresent()).toBe(false);
    });

    it('displays YAML editor for creating a new custom resource instance', async() => {
      await browser.get(`${appHost}/crds?name=${name}`);
      await crudView.isLoaded();
      await crudView.resourceRows.first().element(by.linkText(crd.spec.names.kind)).click();
      await crudView.isLoaded();
      await crudView.createYAMLButton.click();
      await yamlView.isLoaded();

      expect(yamlView.editorContent.getText()).toContain(`kind: CRD${testResourceName}`);
    });

    it('creates a new custom resource instance', async() => {
      await yamlView.saveButton.click();

      expect(yamlView.errorMessage.isPresent()).toBe(false);
    });

    it('deletes the `CustomResourceDefinition`', async() => {
      await browser.get(`${appHost}/crds?name=${name}`);
      await crudView.isLoaded();
      await crudView.deleteRow('CustomResourceDefinition')(crd.spec.names.kind);
      await browser.sleep(500);

      expect(crudView.rowDisabled(crd.spec.names.kind)).toBe(true);
    });
  });

  describe('Editing labels', () => {
    const resourceName = `${testResourceName}-editlabels`;
    const resourceType = 'configmaps';
    const labelValue = 'appblah';

    beforeAll(async() => {
      await browser.get(`${appHost}/ns/${testNamespace}/${resourceType}/new`);
      await yamlView.isLoaded();

      const content = await yamlView.editorContent.getText();
      const newContent = _.defaultsDeep({}, {metadata: {name: resourceName, namespace: testNamespace}}, safeLoad(content));
      await yamlView.setContent(safeDump(newContent));
      await yamlView.saveButton.click();
    });

    it('displays modal for editing resource instance labels', async() => {
      await browser.wait(until.presenceOf(crudView.actionsDropdown));
      await crudView.actionsDropdown.click();
      await browser.wait(until.presenceOf(crudView.actionsDropdownMenu));
      await crudView.actionsDropdownMenu.element(by.linkText('Modify Labels...')).click();
      await browser.wait(until.presenceOf($('.tags input')));
      await $('.tags input').sendKeys(labelValue, Key.ENTER);
      await browser.sleep(500);
      await $('.modal-footer #confirm-delete').click();
      await browser.sleep(500);
    });

    it('updates the resource instance labels', async() => {
      expect($$('.co-m-label__key').first().getText()).toEqual(labelValue);
    });
  });

  xdescribe('Visiting special routes', () => {
    new Set([
      '/clusterroles/view',
      '/nodes',
      '/settings/cluster',
      '/all-namespaces/events',
      '/crds',
      '/',
      '/k8s/all-namespaces/alertmanagers',
      '/ns/tectonic-system/alertmanagers/main',
    ]).forEach(route => {

      it('successfully displays view for route', async() => {
        await browser.get(`${appHost}${route}`);
        console.log(`\nvisited ${route}`);
      });
    });
  });
});
