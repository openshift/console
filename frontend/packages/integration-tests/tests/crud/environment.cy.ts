import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { environment } from '../../views/environment';
import { listPage } from '../../views/list-page';
import * as yamlEditor from '../../views/yaml-editor';

const WORKLOAD_NAME = `filter-${testName}`;

describe('Interacting with the environment variable editor', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
    cy.visit(`/k8s/ns/${testName}/deployments`);
    listPage.clickCreateYAMLbutton();
    cy.byTestID('yaml-view-input').click();
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name: WORKLOAD_NAME, labels: { 'lbl-env': testName } } },
        safeLoad(content),
      );
      yamlEditor.setEditorContent(safeDump(newContent)).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.byTestID('yaml-error').should('not.exist');
        detailsPage.sectionHeaderShouldExist('Deployment details');
      });
    });
    cy.exec(
      `oc create cm my-config --from-literal=cmk1=config1 --from-literal=cmk2=config2 -n ${testName}`,
    );
    cy.exec(
      `oc create secret generic my-secret --from-literal=key1=supersecret --from-literal=key2=topsecret -n ${testName}`,
    );
    checkErrors();
  });

  beforeEach(() => {
    cy.visit(`/k8s/ns/${testName}/deployments/${WORKLOAD_NAME}/environment`);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it('When a variable is added or deleted it shows the correct variables', () => {
    const key = 'KEY';
    const value = 'value';
    environment.addVariable(key, value);
    environment.validateKeyAndValue(key, value, true);
    environment.deleteVariable();
    environment.validateKeyAndValue(key, value, false);
  });

  it('When a variable is added or deleted from a config map it shows the correct variables', () => {
    const resourceName = 'my-config';
    const prefix = 'testcm';
    environment.addVariableFrom(resourceName, prefix);
    environment.validateValueFrom(resourceName, prefix, true);
    environment.deleteFromVariable();
    environment.validateValueFrom(resourceName, prefix, false);
  });

  it('When a variable is added or deleted from a secret it shows the correct variables', () => {
    const resourceName = 'my-secret';
    const prefix = 'testsecret';
    environment.addVariableFrom(resourceName, prefix);
    environment.validateValueFrom(resourceName, prefix, true);
    environment.deleteFromVariable();
    environment.validateValueFrom(resourceName, prefix, false);
  });
});
