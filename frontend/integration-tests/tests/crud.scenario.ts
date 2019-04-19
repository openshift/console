/* eslint-disable no-undef, no-unused-vars, no-console */

import { browser, $, $$, by, ExpectedConditions as until, Key, element } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { execSync } from 'child_process';
import { OrderedMap } from 'immutable';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';
import * as namespaceView from '../views/namespace.view';
import * as createRoleBindingView from '../views/create-role-binding.view';

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
    .set('horizontalpodautoscalers', {kind: 'HorizontalPodAutoscaler'})
    .set('networkpolicies', {kind: 'NetworkPolicy'})
    .set('roles', {kind: 'Role'});
  const openshiftObjs = OrderedMap<string, {kind: string, namespaced?: boolean}>()
    .set('deploymentconfigs', {kind: 'DeploymentConfig'})
    .set('buildconfigs', {kind: 'BuildConfig'})
    .set('imagestreams', {kind: 'ImageStream'})
    .set('routes', {kind: 'Route'});
  const serviceCatalogObjs = OrderedMap<string, {kind: string, namespaced?: boolean}>()
    .set('clusterservicebrokers', {kind: 'servicecatalog.k8s.io~v1beta1~ClusterServiceBroker', namespaced: false});
  let testObjs = browser.params.openshift === 'true' ? k8sObjs.merge(openshiftObjs) : k8sObjs;
  testObjs = browser.params.servicecatalog === 'true' ? testObjs.merge(serviceCatalogObjs) : testObjs;

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(() => {
    const leakedArray: Array<string> = [...leakedResources];
    console.error(`Leaked ${leakedArray.length} resources out of ${testObjs.size}:\n${leakedArray.join('\n')}`);
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

  testObjs.forEach(({kind, namespaced = true}, resource) => {

    describe(kind, () => {
      const name = `${testName}-${kind.toLowerCase()}`;
      it('displays a list view for the resource', async() => {
        await browser.get(`${appHost}${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}?name=${testName}`);
        await crudView.isLoaded();
      });

      if (namespaced) {
        it('has a working namespace dropdown on namespaced objects', async() => {
          await browser.wait(until.presenceOf(namespaceView.namespaceSelector));
          expect(namespaceView.selectedNamespace.getText()).toEqual(testName);
        });
      } else {
        it('does not have a namespace dropdown on non-namespaced objects', async() => {
          expect(namespaceView.namespaceSelector.isPresent()).toBe(false);
        });
      }

      it('displays a YAML editor for creating a new resource instance', async() => {
        const createDropdownIsPresent = await crudView.createItemButton.isPresent();
        if (createDropdownIsPresent) {
          await crudView.createItemButton.click();
          await crudView.createYAMLLink.click();
        } else {
          await crudView.createYAMLButton.click();
        }
        browser.wait(until.and(crudView.untilNoLoadersPresent, until.presenceOf(element(by.cssContainingText('h1', 'Create')))));

        const yamlLinkIsPresent = await crudView.createYAMLLink.isPresent();
        if (yamlLinkIsPresent) {
          await crudView.createYAMLLink.click();
        }
        await yamlView.isLoaded();

        const content = await yamlView.editorContent.getText();
        const newContent = _.defaultsDeep({}, {metadata: {name, labels: {[testLabel]: testName}}}, safeLoad(content));
        await yamlView.setContent(safeDump(newContent));

        expect(yamlView.editorContent.getText()).toContain(name);
      });

      it('creates a new resource instance', async() => {
        leakedResources.add(JSON.stringify({name, plural: resource, namespace: namespaced ? testName : undefined}));
        await yamlView.saveButton.click();

        expect(crudView.errorMessage.isPresent()).toBe(false);
      });

      it('displays detail view for new resource instance', async() => {
        await browser.wait(until.presenceOf(crudView.actionsDropdown));

        expect(browser.getCurrentUrl()).toContain(`/${name}`);
        expect(crudView.resourceTitle.getText()).toEqual(name);
      });

      it('search view displays created resource instance', async() => {
        await browser.get(`${appHost}/search/${namespaced ? `ns/${testName}` : 'all-namespaces'}?kind=${kind}&q=${testLabel}%3d${testName}`);
        await crudView.resourceRowsPresent();
        await crudView.filterForName(name);
        await crudView.rowForName(name).element(by.linkText(name)).click();
        await browser.wait(until.urlContains(`/${name}`));
        expect(crudView.resourceTitle.getText()).toEqual(name);
      });

      it('edit the resource instance', async() => {
        if (kind !== 'ServiceAccount') {
          await browser.get(`${appHost}/search/${namespaced ? `ns/${testName}` : 'all-namespaces'}?kind=${kind}&q=${testLabel}%3d${testName}`);
          await crudView.filterForName(name);
          await crudView.resourceRowsPresent();
          await crudView.editRow(kind)(name);
        }
      });

      it('deletes the resource instance', async() => {
        await browser.get(`${appHost}${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}`);
        await crudView.resourceRowsPresent();
        // Filter by resource name to make sure the resource is on the first page of results.
        // Otherwise the tests fail since we do virtual scrolling and the element isn't found.
        await crudView.filterForName(name);
        await crudView.deleteRow(kind)(name);
        leakedResources.delete(JSON.stringify({name, plural: resource, namespace: namespaced ? testName : undefined}));
      });
    });
  });

  describe('Role Bindings', () => {
    const bindingName = `${testName}-cluster-admin`;
    const roleName = 'cluster-admin';
    it('displays "Create Role Binding" page', async() => {
      await browser.get(`${appHost}/k8s/all-namespaces/rolebindings`);
      await crudView.isLoaded();
      await crudView.createYAMLButton.click();
      await browser.wait(until.textToBePresentInElement($('.co-m-pane__heading'), 'Create Role Binding'));
    });

    it('creates a RoleBinding', async() => {
      await browser.wait(crudView.untilNoLoadersPresent);

      // Role Binding specific actions
      await createRoleBindingView.inputName(bindingName);
      await createRoleBindingView.selectNamespace(testName);
      expect(createRoleBindingView.getSelectedNamespace()).toEqual(testName);
      await createRoleBindingView.selectRole(roleName);
      expect(createRoleBindingView.getSelectedRole()).toEqual(roleName);
      await createRoleBindingView.inputSubject('subject-name');

      await crudView.saveChangesBtn.click();
      expect(crudView.errorMessage.isPresent()).toBe(false);
      await browser.wait(until.presenceOf(element(by.cssContainingText('h1.co-m-pane__heading', bindingName))));
      leakedResources.add(JSON.stringify({name: bindingName, plural: 'rolebindings', namespace: testName}));
    });

    it('displays created RoleBinding in list view', async() => {
      await browser.get(`${appHost}/k8s/ns/${testName}/rolebindings`);
      await crudView.isLoaded();
      await crudView.resourceRowsPresent();
      // Filter by resource name to make sure the resource is on the first page of results.
      // Otherwise the tests fail since we do virtual scrolling and the element isn't found.
      await crudView.filterForName(bindingName);
      expect(crudView.rowForName(bindingName).isPresent()).toBe(true);
    });

    it('deletes the RoleBinding', async() => {
      await crudView.resourceRowsPresent();
      await crudView.deleteRow('RoleBinding')(bindingName);
      leakedResources.delete(JSON.stringify({name: bindingName, plural: 'rolebindings', namespace: testName}));
    });
  });

  describe('Namespace', () => {
    const name = `${testName}-ns`;

    it('displays `Namespace` list view', async() => {
      await browser.get(`${appHost}/k8s/cluster/namespaces`);
      await crudView.isLoaded();

      expect(crudView.rowForName(name).isPresent()).toBe(false);
    });

    it('creates the namespace', async() => {
      await crudView.createYAMLButton.click();
      await browser.wait(until.presenceOf($('.modal-body__field')));
      await $$('.modal-body__field').get(0).$('input').sendKeys(name);
      leakedResources.add(JSON.stringify({name, plural: 'namespaces'}));
      await $('#confirm-action').click();
      await browser.wait(until.invisibilityOf($('.modal-content')), K8S_CREATION_TIMEOUT);

      expect(browser.getCurrentUrl()).toContain(`/k8s/cluster/namespaces/${testName}-ns`);
    });

    it('deletes the namespace', async() => {
      await browser.get(`${appHost}/k8s/cluster/namespaces`);
      // Filter by resource name to make sure the resource is on the first page of results.
      // Otherwise the tests fail since we do virtual scrolling and the element isn't found.
      await crudView.filterForName(name);
      await crudView.resourceRowsPresent();
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
        labels: {[testLabel]: testName},
      },
      spec: {
        group,
        version: 'v1',
        names: {
          plural,
          singular: `crd${testName}`,
          kind: `CRD${testName}`,
          shortNames: [testName],
        },
      },
    };

    it('displays `CustomResourceDefinitions` list view', async() => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions`);
      await crudView.isLoaded();
      expect(crudView.resourceRows.count()).not.toEqual(0);
    });

    it('displays a YAML editor for creating a new custom resource definition', async() => {
      await crudView.createYAMLButton.click();
      await yamlView.isLoaded();
      await yamlView.setContent(safeDump(crd));
      await yamlView.saveButton.click();
      await browser.wait(until.urlContains(name), K8S_CREATION_TIMEOUT);
      expect(crudView.errorMessage.isPresent()).toBe(false);
    });

    it('displays YAML editor for creating a new custom resource instance', async() => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${name}`);
      await crudView.isLoaded();
      await crudView.resourceRows.$$('.co-kebab__button').click();
      await browser.wait(until.elementToBeClickable($('.co-kebab__dropdown')));
      await element(by.cssContainingText('.co-kebab__dropdown a', 'View Instances')).click();
      await crudView.isLoaded();
      await crudView.createYAMLButton.click();
      await yamlView.isLoaded();
      expect(yamlView.editorContent.getText()).toContain(`kind: CRD${testName}`);
    });

    it('creates a new custom resource instance', async() => {
      leakedResources.add(JSON.stringify({name, plural: 'customresourcedefinitions'}));
      await yamlView.saveButton.click();
      expect(crudView.errorMessage.isPresent()).toBe(false);
    });

    it('deletes the `CustomResourceDefinition`', async() => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${name}`);
      await crudView.resourceRowsPresent();
      await crudView.deleteRow('CustomResourceDefinition')(crd.spec.names.kind);
      leakedResources.delete(JSON.stringify({name, plural: 'customresourcedefinitions'}));
    });
  });

  describe('Editing labels', () => {
    const name = `${testName}-editlabels`;
    const plural = 'configmaps';
    const labelValue = 'appblah';

    beforeAll(async() => {
      await browser.get(`${appHost}/k8s/ns/${testName}/${plural}/~new`);
      await yamlView.isLoaded();
      const content = await yamlView.editorContent.getText();
      const newContent = _.defaultsDeep({}, {metadata: {name, namespace: testName}}, safeLoad(content));
      await yamlView.setContent(safeDump(newContent));
      leakedResources.add(JSON.stringify({name, plural, namespace: testName}));
      await yamlView.saveButton.click();
    });

    it('displays modal for editing resource instance labels', async() => {
      await browser.wait(until.presenceOf(crudView.actionsDropdown));
      await crudView.actionsDropdown.click();
      await browser.wait(until.presenceOf(crudView.actionsDropdownMenu));
      await crudView.actionsDropdownMenu.element(by.linkText('Edit Labels')).click();
      await browser.wait(until.presenceOf($('.tags input')));
      await $('.tags input').sendKeys(labelValue, Key.ENTER);
      // This only works because there's only one label
      await browser.wait(until.textToBePresentInElement($('.tags .tag-item'), labelValue), 1000);
      await $('.modal-footer #confirm-action').click();
    });

    it('updates the resource instance labels', async() => {
      await browser.wait(until.presenceOf($('.co-m-label.co-m-label--expand')));
      expect($$('.co-m-label__key').first().getText()).toEqual(labelValue);
    });

    it('sees if label links still work', async() => {
      await $$('.co-m-label').first().click();
      await browser.wait(until.urlContains(`/search/ns/${testName}?kind=core~v1~ConfigMap&q=${labelValue}`));

      expect($('.co-text-configmap').isDisplayed()).toBe(true);
    });

    afterAll(async() => {
      await browser.get(`${appHost}/k8s/ns/${testName}/${plural}/${name}`);
      await browser.wait(until.presenceOf(crudView.actionsDropdown));
      await crudView.actionsDropdown.click();
      await browser.wait(until.presenceOf(crudView.actionsDropdownMenu), 1000);
      await crudView.actionsDropdownMenu.element(by.partialLinkText('Delete ')).click();
      await browser.wait(until.presenceOf($('#confirm-action')));
      await $('.modal-footer #confirm-action').click();

      leakedResources.delete(JSON.stringify({name, plural, namespace: testName}));
    });
  });

  describe('Visiting special routes', () => {
    new Set([
      '/k8s/cluster/clusterroles/view',
      '/k8s/cluster/nodes',
      '/settings/cluster',
      '/k8s/all-namespaces/events',
      '/k8s/cluster/customresourcedefinitions',
      '/',
      '/k8s/all-namespaces/alertmanagers',
      '/k8s/ns/tectonic-system/alertmanagers/main',
    ]).forEach(route => {

      it(`successfully displays view for route: ${route}`, async() => {
        await browser.get(`${appHost}${route}`);
        await browser.sleep(5000);
      });
    });
  });
});
