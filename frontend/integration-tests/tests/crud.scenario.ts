/* eslint-disable no-console */

import { browser, $, $$, by, ExpectedConditions as until, Key, element } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { execSync } from 'child_process';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';
import * as createRoleBindingView from '../views/create-role-binding.view';

const K8S_CREATION_TIMEOUT = 15000;

describe('Kubernetes resource CRUD operations', () => {
  const testLabel = 'automatedTestName';
  const leakedResources = new Set<string>();

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(() => {
    const leakedArray: Array<string> = [...leakedResources];
    if (!_.isEmpty(leakedArray)) {
      console.error(`Leaked ${leakedArray.length} resources\n${leakedArray.join('\n')}.`);
    } else {
      console.log('No resources leaked.');
    }

    leakedArray
      .map((r) => JSON.parse(r) as { name: string; plural: string; namespace?: string })
      .filter((r) => r.namespace === undefined)
      .forEach(({ name, plural }) => {
        try {
          execSync(`kubectl delete --cascade ${plural} ${name}`);
        } catch (error) {
          console.error(`Failed to delete ${plural} ${name}:\n${error}`);
        }
      });
  });

  describe('Role Bindings', () => {
    const bindingName = `${testName}-cluster-admin`;
    const roleName = 'cluster-admin';
    it('displays "Create Role Binding" page', async () => {
      await browser.get(`${appHost}/k8s/all-namespaces/rolebindings`);
      await crudView.isLoaded();
      await crudView.createYAMLButton.click();
      await browser.wait(
        until.textToBePresentInElement($('.co-m-pane__heading'), 'Create Role Binding'),
      );
    });

    it('creates a RoleBinding', async () => {
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
      await browser.wait(
        until.presenceOf(element(by.cssContainingText('h1.co-m-pane__heading', bindingName))),
      );
      leakedResources.add(
        JSON.stringify({ name: bindingName, plural: 'rolebindings', namespace: testName }),
      );
    });

    it('displays created RoleBinding in list view', async () => {
      await browser.get(`${appHost}/k8s/ns/${testName}/rolebindings`);
      await crudView.isLoaded();
      await crudView.resourceRowsPresent();
      // Filter by resource name to make sure the resource is on the first page of results.
      // Otherwise the tests fail since we do virtual scrolling and the element isn't found.
      await crudView.filterForName(bindingName);
      expect(crudView.rowForName(bindingName).isPresent()).toBe(true);
    });

    it('deletes the RoleBinding', async () => {
      await crudView.resourceRowsPresent();
      await crudView.deleteRow('RoleBinding')(bindingName);
      leakedResources.delete(
        JSON.stringify({ name: bindingName, plural: 'rolebindings', namespace: testName }),
      );
    });
  });

  describe('CustomResourceDefinitions', () => {
    const plural = `crd${testName}`;
    const group = 'test.example.com';
    const name = `${plural}.${group}`;
    const crd = {
      apiVersion: 'apiextensions.k8s.io/v1',
      kind: 'CustomResourceDefinition',
      metadata: {
        name,
        labels: { [testLabel]: testName },
      },
      spec: {
        group,
        versions: [
          {
            name: 'v1',
            served: true,
            storage: true,
            schema: {
              openAPIV3Schema: {
                type: 'object',
                properties: {
                  spec: {
                    type: 'object',
                    properties: {
                      cronSpec: {
                        type: 'string',
                      },
                      image: {
                        type: 'string',
                      },
                      replicas: {
                        type: 'integer',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        scope: 'Namespaced',
        names: {
          plural,
          singular: `crd${testName}`,
          kind: `CRD${testName}`,
          shortNames: [testName],
        },
      },
    };

    it('displays `CustomResourceDefinitions` list view', async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions`);
      await crudView.isLoaded();
      expect(crudView.resourceRows.count()).not.toEqual(0);
    });

    it('displays a YAML editor for creating a new custom resource definition', async () => {
      await crudView.createYAMLButton.click();
      await yamlView.isLoaded();
      await yamlView.setEditorContent(safeDump(crd));
      await yamlView.saveButton.click();
      await browser.wait(until.urlContains(name), K8S_CREATION_TIMEOUT);
      expect(crudView.errorMessage.isPresent()).toBe(false);
    });

    it('displays YAML editor for creating a new custom resource instance', async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${name}`);
      await crudView.isLoaded();
      await crudView.clickKebabAction(crd.spec.names.kind, 'View Instances');
      await crudView.isLoaded();
      await crudView.createYAMLButton.click();
      await yamlView.isLoaded();
      expect(yamlView.getEditorContent()).toContain(`kind: CRD${testName}`);
    });

    it('creates a new custom resource instance', async () => {
      leakedResources.add(JSON.stringify({ name, plural: 'customresourcedefinitions' }));
      await yamlView.saveButton.click();
      expect(crudView.errorMessage.isPresent()).toBe(false);
    });

    it('deletes the `CustomResourceDefinition`', async () => {
      await browser.get(`${appHost}/k8s/cluster/customresourcedefinitions?name=${name}`);
      await crudView.resourceRowsPresent();
      await crudView.deleteRow('CustomResourceDefinition')(crd.spec.names.kind);
      leakedResources.delete(JSON.stringify({ name, plural: 'customresourcedefinitions' }));
    });
  });

  describe('Editing labels', () => {
    const name = `${testName}-editlabels`;
    const plural = 'configmaps';
    const kind = 'ConfigMap';
    const labelValue = 'appblah';

    beforeAll(async () => {
      await browser.get(`${appHost}/k8s/ns/${testName}/${plural}/~new`);
      await yamlView.isLoaded();
      const content = await yamlView.getEditorContent();
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name, namespace: testName } },
        safeLoad(content),
      );
      await yamlView.setEditorContent(safeDump(newContent));
      leakedResources.add(JSON.stringify({ name, plural, namespace: testName }));
      await yamlView.saveButton.click();
    });

    it('displays modal for editing resource instance labels', async () => {
      await crudView.clickDetailsPageAction(crudView.actions.labels);
      await browser.wait(until.presenceOf($('.tags input')));
      await $('.tags input').sendKeys(labelValue, Key.ENTER);
      // This only works because there's only one label
      await browser.wait(until.textToBePresentInElement($('.tags .tag-item'), labelValue), 1000);
      await $('.modal-footer #confirm-action').click();
    });

    it('updates the resource instance labels', async () => {
      await browser.wait(until.presenceOf($('.co-m-label.co-m-label--expand')));
      expect(
        $$('.co-m-label__key')
          .first()
          .getText(),
      ).toEqual(labelValue);
    });

    it('sees if label links still work', async () => {
      await $$('.co-m-label')
        .first()
        .click();
      await browser.wait(
        until.urlContains(`/search/ns/${testName}?kind=core~v1~ConfigMap&q=${labelValue}`),
      );

      expect($('.pf-c-chip__text').isDisplayed()).toBe(true);
    });

    afterAll(async () => {
      await crudView.deleteResource(plural, kind, name);
      leakedResources.delete(JSON.stringify({ name, plural, namespace: testName }));
    });
  });

  describe('Visiting other routes', () => {
    const otherRoutes = [
      '/',
      '/k8s/cluster/clusterroles/view',
      '/k8s/cluster/nodes',
      '/k8s/all-namespaces/events',
      '/k8s/all-namespaces/import',
      '/api-explorer',
      '/api-resource/ns/default/core~v1~Pod',
      '/api-resource/ns/default/core~v1~Pod/schema',
      '/api-resource/ns/default/core~v1~Pod/instances',
      ...(browser.params.openshift === 'true'
        ? [
            '/api-resource/ns/default/core~v1~Pod/access',
            '/k8s/cluster/user.openshift.io~v1~User',
            '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~Machine',
            '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~MachineSet',
            '/k8s/ns/openshift-machine-api/autoscaling.openshift.io~v1beta1~MachineAutoscaler',
            '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~MachineHealthCheck',
            '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig',
            '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfigPool',
            '/k8s/all-namespaces/monitoring.coreos.com~v1~Alertmanager',
            '/k8s/ns/openshift-monitoring/monitoring.coreos.com~v1~Alertmanager/main',
            '/settings/cluster',
            '/monitoring/query-browser',
            // Test loading search page for a kind with no static model.
            '/search/all-namespaces?kind=config.openshift.io~v1~Console',
          ]
        : []),
    ];
    otherRoutes.forEach((route) => {
      it(`successfully displays view for route: ${route}`, async () => {
        await browser.get(`${appHost}${route}`);
        await browser.sleep(5000);
        expect(crudView.errorPage.isPresent()).toBe(false);
      });
    });
  });
});
