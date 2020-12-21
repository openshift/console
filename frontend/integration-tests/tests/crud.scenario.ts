/* eslint-disable no-console */

import { browser, $, $$, ExpectedConditions as until, Key } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { execSync } from 'child_process';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';

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
      await crudView.clickKebabAction(crd.spec.names.kind, 'View instances');
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
      await crudView.deleteRow('CustomResourceDefinition', true)(crd.spec.names.kind);
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
});
