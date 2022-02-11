import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import * as yamlEditor from '../../views/yaml-editor';

const POD_NAME = `pod1`;
const CONTAINER_NAME = `container1`;
const XTERM_CLASS = `[class="xterm-viewport"]`;
const podToDebug = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}
spec:
  containers:
    - name: ${CONTAINER_NAME}
      image: quay.io/fedora/fedora
  restartPolicy: Always`;

describe('Debug pod', () => {
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
    cy.visit(`/k8s/ns/${testName}/pods`);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(POD_NAME);
    listPage.rows.clickKebabAction(POD_NAME, 'Delete Pod');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    cy.deleteProject(testName);
    cy.logout();
  });

  it('Create pod that has crashbackloop error', () => {
    cy.visit(`/k8s/ns/${testName}/import`);
    yamlEditor.isImportLoaded();
    yamlEditor.setEditorContent(podToDebug).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.get(errorMessage).should('not.exist');
      detailsPage.titleShouldContain(POD_NAME);
    });
  });

  it('Opens debug terminal page from Logs subsection', () => {
    cy.visit(`/k8s/ns/${testName}/pods`);
    listPage.rows.shouldExist(POD_NAME);
    cy.visit(`/k8s/ns/${testName}/pods/${POD_NAME}`);
    detailsPage.isLoaded();
    detailsPage.selectTab('Logs');
    detailsPage.isLoaded();
    cy.byTestID('debug-container-link').click();
    listPage.titleShouldHaveText(`Debug ${CONTAINER_NAME}`);
    cy.get(XTERM_CLASS).should('exist');
  });

  it('Opens debug terminal page from Pod Details - Status tool tip', () => {
    cy.visit(`/k8s/ns/${testName}/pods/${POD_NAME}`);
    detailsPage.isLoaded();
    cy.byTestID('popover-status-button').click();
    cy.byTestID(`popup-debug-container-link-${CONTAINER_NAME}`).click();
    listPage.titleShouldHaveText(`Debug ${CONTAINER_NAME}`);
    cy.get(XTERM_CLASS).should('exist');
  });

  it('Opens debug terminal page from Pods Page - Status tool tip', () => {
    cy.visit(`/k8s/ns/${testName}/pods`);
    listPage.rows.shouldExist(POD_NAME);
    listPage.rows.clickStatusButton(POD_NAME);
    // Click on first debug link
    cy.byTestID(`popup-debug-container-link-${CONTAINER_NAME}`).click();
    listPage.titleShouldHaveText(`Debug ${CONTAINER_NAME}`);
    cy.get(XTERM_CLASS).should('exist');
  });
});
