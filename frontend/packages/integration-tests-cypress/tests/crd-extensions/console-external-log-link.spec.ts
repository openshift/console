import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import * as yamlEditor from '../../views/yaml-editor';

const crd = 'ConsoleExternalLogLink';

describe(`${crd} CRD`, () => {
  const name = `${testName}-cell`;
  const podName = `${testName}-pod`;
  const cell = `[data-test-id=${name}]`;
  const text = `${name} Logs`;
  const namespaceFilter = '^openshift-';

  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.exec(`oc new-project ${testName}`);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.exec(`oc delete project ${testName}`);
    cy.logout();
  });

  it(`creates, displays, modifies, and deletes a new ${crd} instance`, () => {
    cy.visit(`/k8s/cluster/customresourcedefinitions?custom-resource-definition-name=${crd}`);
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickRowByName(crd);
    detailsPage.titleShouldContain('consoleexternalloglinks.console.openshift.io');
    detailsPage.selectTab('Instances');
    listPage.clickCreateYAMLbutton();
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name }, spec: { text } },
        safeLoad(content),
      );
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.get(errorMessage).should('not.exist');
      });
    });

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}`);
    detailsPage.titleShouldContain(name);

    cy.visit(`/k8s/ns/${testName}/pods`);
    listPage.clickCreateYAMLbutton();
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name: podName, labels: { app: name } } },
        safeLoad(content),
      );
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.get(errorMessage).should('not.exist');
      });
    });

    cy.visit(`/k8s/ns/${testName}/pods/${podName}/logs`);
    cy.get(cell).should('exist');

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}/yaml`);
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep({}, { spec: { namespaceFilter } }, safeLoad(content));
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.get(errorMessage).should('not.exist');
      });
    });

    cy.visit(`/k8s/ns/${testName}/pods/${podName}/logs`);
    cy.get('[data-test="log-links"').should('exist');
    cy.get(cell).should('not.exist');

    cy.visit(`/k8s/ns/${testName}/pods?name=${podName}`);
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickKebabAction(podName, 'Delete Pod');
    modal.shouldBeOpened();
    modal.modalTitleShouldContain('Delete Pod');
    modal.submit();
    modal.shouldBeClosed();

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}`);
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickKebabAction(name, `Delete ${crd}`);
    modal.shouldBeOpened();
    modal.modalTitleShouldContain(`Delete ${crd}`);
    modal.submit();
    modal.shouldBeClosed();
  });
});
