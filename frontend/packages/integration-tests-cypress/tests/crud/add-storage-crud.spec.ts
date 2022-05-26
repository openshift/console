import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { testName, checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';
import { errorMessage, submitButton } from '../../views/form';
import { listPage } from '../../views/list-page';
import * as yamlEditor from '../../views/yaml-editor';

const k8sWorkloads = [
  'replicationcontrollers',
  'daemonsets',
  'deployments',
  'replicasets',
  'statefulsets',
];
const openshiftWorkloads = ['deploymentconfigs'];
const resourceObjs =
  Cypress.env('openshift') === true ? k8sWorkloads.concat(openshiftWorkloads) : k8sWorkloads;

describe('Add storage is applicable for all workloads', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    resourceObjs.forEach((resourceType) => {
      try {
        cy.exec(`kubectl delete --cascade ${resourceType} example -n ${testName}`, {
          failOnNonZeroExit: false,
        });
      } catch (error) {
        console.error(`Failed to delete ${resourceType} example:\n${error}`);
      }
    });
    cy.deleteProject(testName);
    cy.logout();
  });

  resourceObjs.forEach((resourceType) => {
    const pvcName = `${resourceType}-pvc`;
    const pvcSize = '1';
    const mountPath = '/data';
    describe(resourceType, () => {
      it(`create a ${resourceType} resource and adds storage to it`, () => {
        if (resourceType === 'deployments' || resourceType === 'deploymentconfigs') {
          const name = `${testName}-${resourceType}`;
          cy.visit(`/k8s/ns/${testName}/${resourceType}`);
          listPage.clickCreateYAMLbutton();
          cy.byTestID('yaml-view-input').click();
          // sidebar needs to be fully loaded, else it sometimes overlays the Create button
          cy.byTestID('resource-sidebar').should('exist');
          yamlEditor.isLoaded();
          let newContent;
          // get, update, and set yaml editor content.
          yamlEditor.getEditorContent().then((content) => {
            newContent = _.defaultsDeep(
              {},
              {
                metadata: { name },
                ...(resourceType === 'deploymentconfigs'
                  ? {
                      spec: {
                        selector: { app: name },
                        template: { metadata: { labels: { app: name } } },
                      },
                    }
                  : {}),
              },

              safeLoad(content),
            );
            yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
              yamlEditor.clickSaveCreateButton();
              cy.get(errorMessage).should('not.exist');
            });
          });
        } else {
          listPage.createNamespacedResourceWithDefaultYAML(resourceType, testName);
        }
        cy.get(errorMessage).should('not.exist');

        detailsPage.clickPageActionFromDropdown('Add storage');
        cy.byTestID('claim-name').should('be.visible');
        cy.byTestID('Create new claim-radio-input').click();
        cy.byTestID('pvc-name').type(pvcName);
        cy.byTestID('pvc-size').type(pvcSize);
        cy.byTestID('mount-path').type(mountPath);
        cy.get(submitButton).click();
        cy.get(errorMessage).should('not.exist');
        cy.get(`[data-test-volume-name-for="${pvcName}"]`).should('have.text', pvcName);
        cy.get(`[data-test-mount-path-for="${pvcName}"]`).should('have.text', mountPath);
      });
    });
  });
});
