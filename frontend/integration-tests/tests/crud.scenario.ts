/* eslint-disable no-undef, no-unused-vars, no-console */

import { browser, $, $$, by, ExpectedConditions as until, Key } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { execSync } from 'child_process';
import { OrderedMap } from 'immutable';

import { appHost, testName, checkLogs } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';

const K8S_CREATION_TIMEOUT = 15000;

describe('Kubernetes resource CRUD operations', () => {
  const testLabel = 'automatedTestName';
  const leakedResources = new Set<string>();
  const k8sObjs = OrderedMap<string, {kind: string, namespaced?: boolean}>()
    .set('pods', {kind: 'Pod'})
    .set('services', {kind: 'Service'})
    .set('serviceaccounts', {kind: 'ServiceAccount'})
    .set('secrets', {kind: 'Secret'})
    .set('configmaps', {kind: 'ConfigMap'})
    .set('persistentvolumes', {kind: 'PersistentVolume', namespaced: false})
    .set('storageclasses', {kind: 'StorageClass', namespaced: false})
    .set('ingresses', {kind: 'Ingress'})
    .set('cronjobs', {kind: 'CronJob'})
    .set('jobs', {kind: 'Job'})
    .set('daemonsets', {kind: 'DaemonSet'})
    .set('deployments', {kind: 'Deployment'})
    .set('replicasets', {kind: 'ReplicaSet'})
    .set('replicationcontrollers', {kind: 'ReplicationController'})
    .set('persistentvolumeclaims', {kind: 'PersistentVolumeClaim'})
    .set('statefulsets', {kind: 'StatefulSet'})
    .set('resourcequotas', {kind: 'ResourceQuota'})
    .set('networkpolicies', {kind: 'NetworkPolicy'})
    .set('roles', {kind: 'Role'});

  afterEach(() => {
    checkLogs();
  });

  afterAll(() => {
    const leakedArray: Array<string> = [...leakedResources];
    console.error(`Leaked ${leakedArray.length} resources out of ${k8sObjs.size}:\n${leakedArray.join('\n')}`);
    leakedArray.map(r => JSON.parse(r) as {name: string, plural: string, namespace?: string})
      .filter(r => r.namespace === undefined)
      .forEach(({name, namespace, plural}) => {
        try {
          execSync(`kubectl delete --cascade ${plural} ${name}`);
        } catch (error) {
          console.error(`Failed to delete ${plural} ${name}:\n${error}`);
        }
      });
  });

  k8sObjs.forEach(({kind, namespaced = true}, resource) => {

    describe(kind, () => {

      it('displays a list view for the resource', async() => {
        await browser.get(`${appHost}${namespaced ? `/ns/${testName}` : ''}/${resource}?name=${testName}`);
        await crudView.isLoaded();
      });

      it('displays a YAML editor for creating a new resource instance', async() => {
        await crudView.createYAMLButton.click();
        await yamlView.isLoaded();

        const content = await yamlView.editorContent.getText();
        const newContent = _.defaultsDeep({}, {metadata: {name: testName, labels: {[testLabel]: testName}}}, safeLoad(content));
        await yamlView.setContent(safeDump(newContent));

        expect(yamlView.editorContent.getText()).toContain(testName);
      });

      it('creates a new resource instance', async() => {
        leakedResources.add(JSON.stringify({name: testName, plural: resource, namespace: namespaced ? testName : undefined}));
        await yamlView.saveButton.click();

        expect(yamlView.errorMessage.isPresent()).toBe(false);
      });

      it('displays detail view for new resource instance', async() => {
        await browser.wait(until.presenceOf(crudView.actionsDropdown), 500);

        expect(browser.getCurrentUrl()).toContain(`/${testName}`);
        expect(crudView.resourceTitle.getText()).toEqual(testName);
      });

      it('search view displays created resource instance', async() => {
        await browser.get(`${appHost}${namespaced ? `/ns/${testName}` : ''}/search?kind=${kind}&q=${testLabel}%3d${testName}`);
        await crudView.isLoaded();
        await crudView.rowForName(testName).element(by.linkText(testName)).click();
        await browser.wait(until.urlContains(`/${testName}`));

        if (resource !== 'roles'){
          expect(crudView.resourceTitle.getText()).toEqual(testName);
        }
      });

      it('deletes the resource instance', async() => {
        await browser.get(`${appHost}${namespaced ? `/ns/${testName}` : ''}/${resource}`);
        await crudView.isLoaded();
        await crudView.deleteRow(kind)(testName);

        leakedResources.delete(JSON.stringify({name: testName, plural: resource, namespace: namespaced ? testName : undefined}));
      });
    });
  });

  describe('Namespace', () => {
    const name = `${testName}-ns`;

    it('displays `Namespace` list view', async() => {
      await browser.get(`${appHost}/namespaces`);
      await crudView.isLoaded();

      expect(crudView.rowForName(name).isPresent()).toBe(false);
    });

    it('creates the namespace', async() => {
      await crudView.createYAMLButton.click();
      await browser.wait(until.presenceOf($('.modal-body__field')));
      await $$('.modal-body__field').get(0).$('input').sendKeys(name);
      leakedResources.add(JSON.stringify({name, plural: 'namespaces'}));
      await $('#confirm-delete').click();
      await browser.wait(until.invisibilityOf($('.modal-content')), K8S_CREATION_TIMEOUT);

      expect(browser.getCurrentUrl()).toContain(`/namespaces/${testName}-ns`);
    });

    it('deletes the namespace', async() => {
      await browser.get(`${appHost}/namespaces`);
      await crudView.isLoaded();
      await crudView.deleteRow('Namespace')(name);
      leakedResources.delete(JSON.stringify({name, plural: 'namespaces'}));
    });
  });

  describe('CustomResourceDefinitions', () => {
    const plural = `crd${testName}`;
    const group = 'test.example.com';
    const name = `${plural}.${group}`;
    const crd = {
      apiVersion: 'apiextensions.k8s.io/v1beta1',
      kind: 'CustomResourceDefinition',
      metadata: {
        name,
        labels: {[testLabel]: testName}
      },
      spec: {
        group,
        version: 'v1',
        names: {
          plural,
          singular: `crd${testName}`,
          kind: `CRD${testName}`,
          shortNames: [testName],
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
      await browser.wait(until.urlContains(name), K8S_CREATION_TIMEOUT);

      expect(yamlView.errorMessage.isPresent()).toBe(false);
    });

    it('displays YAML editor for creating a new custom resource instance', async() => {
      await browser.get(`${appHost}/crds?name=${name}`);
      await crudView.isLoaded();
      await crudView.resourceRows.first().element(by.linkText(crd.spec.names.kind)).click();
      await crudView.isLoaded();
      await crudView.createYAMLButton.click();
      await yamlView.isLoaded();

      expect(yamlView.editorContent.getText()).toContain(`kind: CRD${testName}`);
    });

    xit('creates a new custom resource instance', async() => {
      leakedResources.add(JSON.stringify({name, plural: 'customresourcedefinitions'}));
      await yamlView.saveButton.click();

      expect(yamlView.errorMessage.isPresent()).toBe(false);
    });

    it('deletes the `CustomResourceDefinition`', async() => {
      await browser.get(`${appHost}/crds?name=${name}`);
      await crudView.isLoaded();
      await crudView.deleteRow('CustomResourceDefinition')(crd.spec.names.kind);
      leakedResources.delete(JSON.stringify({name, plural: 'customresourcedefinitions'}));
      await browser.sleep(500);

      expect(crudView.rowDisabled(crd.spec.names.kind)).toBe(true);
    });
  });

  describe('Editing labels', () => {
    const name = `${testName}-editlabels`;
    const plural = 'configmaps';
    const labelValue = 'appblah';

    beforeAll(async() => {
      await browser.get(`${appHost}/ns/${testName}/${plural}/new`);
      await yamlView.isLoaded();

      const content = await yamlView.editorContent.getText();
      const newContent = _.defaultsDeep({}, {metadata: {name, namespace: testName}}, safeLoad(content));
      await yamlView.setContent(safeDump(newContent));
      leakedResources.add(JSON.stringify({name, plural, namespace: testName}));
      await yamlView.saveButton.click();
    });

    it('displays modal for editing resource instance labels', async() => {
      await browser.wait(until.presenceOf(crudView.actionsDropdown), 500);
      await crudView.actionsDropdown.click();
      await browser.wait(until.presenceOf(crudView.actionsDropdownMenu), 500);
      await crudView.actionsDropdownMenu.element(by.linkText('Modify Labels...')).click();
      await browser.wait(until.presenceOf($('.tags input')), 500);
      await $('.tags input').sendKeys(labelValue, Key.ENTER);
      await browser.sleep(500);
      await $('.modal-footer #confirm-delete').click();
    });

    it('updates the resource instance labels', async() => {
      await browser.wait(until.presenceOf($('.co-m-label.co-m-label--expand')));
      expect($$('.co-m-label__key').first().getText()).toEqual(labelValue);

      await crudView.actionsDropdown.click();
    });

    afterAll(async() => {
      await browser.wait(until.presenceOf(crudView.actionsDropdownMenu), 500);
      await crudView.actionsDropdownMenu.element(by.partialLinkText('Delete ')).click();
      await browser.wait(until.presenceOf($('#confirm-delete')));
      await $('.modal-footer #confirm-delete').click();

      leakedResources.delete(JSON.stringify({name, plural, namespace: testName}));
    });
  });

  describe('Visiting special routes', () => {
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

      it(`successfully displays view for route: ${route}`, async() => {
        await browser.get(`${appHost}${route}`);
        await browser.sleep(5000);
      });
    });
  });
});
