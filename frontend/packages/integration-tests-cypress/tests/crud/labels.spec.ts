import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { labels } from '../../views/labels';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import * as yamlEditor from '../../views/yaml-editor';

describe('Editing labels', () => {
  const name = `${testName}-editlabels`;
  const plural = 'configmaps';
  const kind = 'ConfigMap';
  const labelValue = 'appblah';
  const yaml: ConfigMapKind = {
    apiVersion: 'v1',
    kind,
    metadata: {
      name,
      namespace: testName,
    },
  };

  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
    cy.visit(`k8s/ns/${testName}/${plural}/~new`);
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep({}, yaml, safeLoad(content));
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.get(errorMessage).should('not.exist');
      });
    });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`Adds a resource instance label, updates the resource instance label, and makes sure the link works`, () => {
    detailsPage.isLoaded();
    detailsPage.clickPageActionFromDropdown('Edit labels');
    modal.shouldBeOpened();
    labels.inputLabel(labelValue);
    modal.submit();
    detailsPage.isLoaded();
    labels.confirmDetailsPageLabelExists(labelValue);
    labels.clickDetailsPageLabel();
    detailsPage.isLoaded();
    cy.url().should('include', `/search/ns/${testName}?kind=core~v1~ConfigMap&q=${labelValue}`);
    labels.chipExists();
  });
});
