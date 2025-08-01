import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';

const crd = 'ConsoleNotification';

describe(`${crd} CRD`, () => {
  const name = `${testName}-cn`;
  const location = 'BannerTop';
  const altLocation = 'BannerBottom';
  const text = `${name} notification that appears ${location}`;
  const altText = `${name} notification that appears ${altLocation}`;
  const notification = `[data-test=${name}-${location}]`;
  const altNotification = `[data-test=${name}-${altLocation}]`;

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.initAdmin();
  });

  afterEach(() => {
    checkErrors();
  });

  it(`creates, displays, modifies, and deletes a new ${crd} instance`, () => {
    cy.visit(`/k8s/cluster/customresourcedefinitions?custom-resource-definition-name=${crd}`);
    listPage.isCreateButtonVisible();
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickKebabAction(crd, 'View instances');
    listPage.titleShouldHaveText(crd);
    listPage.clickCreateYAMLbutton();
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name }, spec: { location, text } },
        safeLoad(content),
      );
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.byTestID('yaml-error').should('not.exist');
      });
    });

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}`);
    detailsPage.isLoaded();
    detailsPage.titleShouldContain(name);
    cy.log('Additional printer columns should exist.');
    cy.byTestID('additional-printer-columns').should('exist');
    cy.byTestSelector('details-item-label__Text').should('have.text', 'Text');
    cy.byTestSelector('details-item-value__Text').should('have.text', text);
    cy.byTestSelector('details-item-label__Location').should('have.text', 'Location');
    cy.byTestSelector('details-item-value__Location').should('have.text', location);
    cy.byTestSelector('details-item-label__Age').should('have.text', 'Age');
    cy.byTestSelector('details-item-value__Age').should('exist');

    cy.get(notification).contains(text).should('exist').and('be.visible');

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}/yaml`);
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep(
        {},
        {
          metadata: { name },
          spec: {
            location: altLocation,
            text: altText,
          },
        },
        safeLoad(content),
      );
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.byTestID('yaml-error').should('not.exist');
      });
    });

    cy.get(altNotification).contains(altText).should('exist').and('be.visible');

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}`);
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickKebabAction(name, `Delete ${crd}`);
    modal.shouldBeOpened();
    modal.modalTitleShouldContain(`Delete ${crd}`);
    modal.submit();
    modal.shouldBeClosed();
  });
});
