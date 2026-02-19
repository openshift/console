import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import type { CustomResourceDefinitionKind } from '@console/internal/module/k8s';
import { checkErrors, testName } from '../../support';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';

describe('CustomResourceDefinitions', () => {
  const plural = `crd${testName}`;
  const group = 'test.example.com';
  const name = `${plural}.${group}`;
  const testLabel = 'automatedTestName';
  const crd: CustomResourceDefinitionKind = {
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
        listKind: 'ClusterResourceDefinition',
      },
    },
  };
  const customResource = {
    name,
    apiVersion: `${group}/v1`,
    kind: `CRD${testName}`,
    metadata: {
      name,
      namespace: testName,
    },
    spec: {},
    plural: 'customresourcedefinitions',
  };

  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it('creates, displays, and deletes `CustomResourceDefinitions` and creates a new custom resource instance', () => {
    cy.visit('/k8s/cluster/customresourcedefinitions');
    listPage.dvRows.shouldBeLoaded();
    listPage.clickCreateYAMLbutton();
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep({}, crd, safeLoad(content));
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.byTestID('yaml-error').should('not.exist');
      });
    });
    cy.visit(`/k8s/cluster/customresourcedefinitions?name=${name}`);
    listPage.isCreateButtonVisible();
    listPage.dvRows.shouldBeLoaded();
    listPage.dvRows.clickKebabAction(`CRD${testName}`, 'View instances');
    listPage.clickCreateYAMLbutton();
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep({}, customResource, safeLoad(content));
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.byTestID('yaml-error').should('not.exist');
      });
    });
    cy.visit(`/k8s/cluster/customresourcedefinitions?name=${name}`);
    listPage.isCreateButtonVisible();
    listPage.dvRows.shouldBeLoaded();
    listPage.dvRows.clickKebabAction(`CRD${testName}`, 'Delete CustomResourceDefinition');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    cy.resourceShouldBeDeleted(testName, 'CustomResourceDefinition', `CRD${testName}`);
  });
});
