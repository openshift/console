import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { CustomResourceDefinitionKind } from '@console/internal/module/k8s';
import { checkErrors, testName } from '../../support';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { nav } from '../../views/nav';
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
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it('creates, displays, and deletes `CustomResourceDefinitions` and creates a new custom resource instance', () => {
    it('displays a YAML editor for creating a new custom resource definition', () => {
      cy.visit('/k8s/cluster/customresourcedefinitions');
      listPage.rows.shouldBeLoaded();
      listPage.clickCreateYAMLbutton();
      yamlEditor.isLoaded();
      yamlEditor.getEditorContent().then((content) => {
        const newContent = _.defaultsDeep({}, crd, safeLoad(content));
        yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
          yamlEditor.clickSaveCreateButton();
          cy.get(errorMessage).should('not.exist');
        });
      });
      cy.visit(`/k8s/cluster/customresourcedefinitions?name=${name}`);
      listPage.rows.shouldBeLoaded();
      listPage.rows.clickKebabAction(`CRD${testName}`, 'View instances');
      listPage.clickCreateYAMLbutton();
      yamlEditor.isLoaded();
      yamlEditor.getEditorContent().then((content) => {
        const newContent = _.defaultsDeep({}, customResource, safeLoad(content));
        yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
          yamlEditor.clickSaveCreateButton();
          cy.get(errorMessage).should('not.exist');
        });
      });
      cy.visit(`/k8s/cluster/customresourcedefinitions?name=${name}`);
      listPage.rows.shouldBeLoaded();
      listPage.rows.clickKebabAction(`CRD${testName}`, 'Delete CustomResourceDefinition');
      cy.resourceShouldBeDeleted(testName, 'CustomResourceDefinition', `CRD${testName}`);
    });
  });
});
