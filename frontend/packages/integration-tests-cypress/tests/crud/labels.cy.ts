import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { labels } from '../../views/labels';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';

describe('Editing labels', () => {
  const name = `${testName}-editlabels`;
  const plural = 'configmaps';
  const kind = 'ConfigMap';
  const label1Key = 'label1';
  const label1 = `${label1Key}=label1`;
  const yaml: ConfigMapKind = {
    apiVersion: 'v1',
    kind,
    metadata: {
      name,
      namespace: testName,
    },
  };
  const addLabelByCLI = (label: string) =>
    cy.exec(`oc label ${plural} ${name} -n ${testName} ${label}`);
  const removeLabelByCLI = (labelKey: string) =>
    cy.exec(`oc label ${plural} ${name} -n ${testName} ${labelKey}-`);

  before(() => {
    cy.login();
    cy.initAdmin();
    cy.createProjectWithCLI(testName);
    cy.visit(`k8s/ns/${testName}/${plural}/~new`);
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep({}, yaml, safeLoad(content));
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.byTestID('yaml-error').should('not.exist');
      });
    });
  });

  beforeEach(() => {
    cy.visit(`k8s/ns/${testName}/configmaps/${name}`);
    detailsPage.isLoaded();
    detailsPage.clickPageActionFromDropdown('Edit labels');
    modal.shouldBeOpened();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it(`Adds a resource instance label, updates the resource instance label, and makes sure the link works`, () => {
    labels.inputLabel(label1);
    modal.submit();
    detailsPage.isLoaded();
    labels.confirmDetailsPageLabelExists(label1Key);
    labels.clickDetailsPageLabel();
    detailsPage.isLoaded();
    cy.url().should('include', `/search/ns/${testName}?kind=core~v1~ConfigMap&q=${label1Key}`);
    labels.chipExists(label1);
    removeLabelByCLI(label1Key);
  });

  it(`Disables Save and displays an info alert in the label modal if the labels change`, () => {
    cy.log('Add a label via the CLI and check the modal contents');
    addLabelByCLI(label1).then(() => {
      cy.byTestID('confirm-action').should('be.disabled');
      cy.byTestID('button-bar-info-message').should('exist');
    });
    removeLabelByCLI(label1Key);
  });
});
