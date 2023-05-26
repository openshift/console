import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  addOptions,
  devNavigationMenu,
  nodeActions,
} from '@console/dev-console/integration-tests/support/constants';
import { formPO, topologyPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  deleteRevision,
  editLabels,
  editAnnotations,
  navigateTo,
  addPage,
  createGitWorkloadIfNotExistsOnTopologyPage,
  app,
  gitPage,
} from '@console/dev-console/integration-tests/support/pages';
import {
  topologyPage,
  topologySidePane,
} from '@console/topology/integration-tests/support/pages/topology';

let numOfAnnotationsBeforeAdd: number;

Given('user is at Import from git page', () => {
  addPage.selectCardFromOptions(addOptions.ImportFromGit);
});

Given(
  'number of annotations are {string} present in revision side bar details of service {string}',
  (numOfAnnotations: string, serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).click({ force: true });
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyNumberOfAnnotations(numOfAnnotations);
  },
);

Given(
  'Revision of Knative service {string} consists of annotations in topology side bar',
  (serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).click({ force: true });
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    cy.get(topologyPO.sidePane.editAnnotations).then(($el) => {
      const res = $el.text().split(' ');
      numOfAnnotationsBeforeAdd = Number(res[0]);
    });
  },
);

Then('user is able to see Knative Revision', () => {
  topologyPage.waitForKnativeRevision();
});

Given('Knative Revision is available in topology page', () => {
  topologyPage.waitForKnativeRevision();
});

Then(
  'number of annotations increased to {string} in revision side bar details of service {string}',
  (numOfAnnotations: string, serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).click();
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyNumberOfAnnotations(numOfAnnotations);
  },
);

Then(
  'number of annotations increases for revision of knative service {string} in topology side bar',
  (serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).click();
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    cy.get(topologyPO.sidePane.editAnnotations).then(($el) => {
      const res = $el.text().split(' ');
      expect(res[0]).toBeGreaterThan(numOfAnnotationsBeforeAdd);
    });
  },
);

Given('knative service {string} with multiple revisions', (serviceName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    serviceName,
    'Knative',
  );
  topologyPage.verifyUserIsInGraphView();
  topologyPage.waitForLoad();
  topologyPage.rightClickOnKnativeService(serviceName);
  topologyPage.selectContextMenuAction(`Edit ${serviceName}`);

  app.waitForLoad();
  cy.get('button').contains('Labels').scrollIntoView().click();
  gitPage.enterLabels('app=frontend');
  cy.get(formPO.create).click();
  topologyPage.verifyTopologyPage();
  topologyPage.verifyUserIsInGraphView();
  app.waitForLoad();

  // Open sidebar if not already opened
  cy.get('body').then(($body) => {
    if ($body.find('[data-test-id="actions-menu-button"]').length === 0) {
      topologyPage.clickOnKnativeService(serviceName);
    }
  });

  cy.log(`user is able to see revisions in knative service : ${serviceName} of topology side pane`);
  topologySidePane.selectTab('Resources');
  topologySidePane.verifySection('Revisions');
  cy.get('.revision-overview-list').next('ul').find('li').should('have.length', 2);
});

When(
  'user right clicks on the revision of knative service {string} to open the context menu',
  (serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).first().trigger('contextmenu', { force: true });
  },
);

When('user clicks on Save button', () => {
  modal.submit();
});

Given(
  'user added label {string} to the revision of knative service {string}',
  (labelName: string, serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).trigger('contextmenu', { force: true });
    cy.byTestActionID('Edit Labels').click();
    editLabels.enterLabel(labelName);
    modal.submit();
  },
);

When('user selects {string} option from knative revision context menu', (option: string) => {
  cy.byTestActionID(option).click();
});

When(
  'user removes the label {string} from existing labels list in Edit Labels modal',
  (labelName: string) => {
    editLabels.removeLabel(labelName);
  },
);

When(
  'user adds the label {string} to existing labels list in Edit Labels modal',
  (labelName: string) => {
    editLabels.enterLabel(labelName);
  },
);

When(
  'user removes the label {string} from existing labels list in {string} modal',
  (labelName: string, modalHeader: string) => {
    modal.modalTitleShouldContain(modalHeader);
    editLabels.removeLabel(labelName);
  },
);

When(
  'user clicks on remove icon for the annotation with key {string} present in {string} modal',
  (annotationKey: string, modalHeader: string) => {
    modal.modalTitleShouldContain(modalHeader);
    editAnnotations.removeAnnotation(annotationKey);
  },
);

When('user clicks cancel button on the {string} modal', (modalTitle: string) => {
  modal.modalTitleShouldContain(modalTitle);
  modal.cancel();
});

When('user clicks save button on the {string} modal', (modalTitle: string) => {
  modal.modalTitleShouldContain(modalTitle);
  modal.submit();
});

When('user clicks on Details tab', () => {
  topologyPage.revisionDetails.clickOnDetailsTab();
});

When('user clicks save button on Revision Yaml page', () => {
  topologyPage.revisionDetails.yaml.clickOnSave();
});

Then(
  'user is able to see Edit Labels, Edit Annotations, Edit Revision, Delete Revision options in context menu',
  () => {
    cy.byTestActionID(nodeActions.EditLabels).should('be.visible');
    cy.byTestActionID(nodeActions.EditAnnotations).should('be.visible');
    cy.byTestActionID(nodeActions.EditRevision).should('be.visible');
    cy.byTestActionID(nodeActions.DeleteRevision).should('be.visible');
  },
);

Then('save button is displayed', () => {
  modal.submitShouldBeEnabled();
  modal.cancel();
});

Then('save, cancel buttons are displayed', () => {
  cy.byTestID('confirm-action').should('be.visible');
  cy.byLegacyTestID('modal-cancel-action').should('be.visible');
});

Then(
  'user can see the label {string} in the Details tab of the Sidebar of {string}',
  (label: string, serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).first().click({ force: true });
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyLabel(label);
  },
);

Then(
  'user will not see the label {string} in the Details tab of the Sidebar of {string}',
  (label: string, serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).first().click({ force: true });
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    const labelName = label.split('=');
    const key = labelName[0];
    cy.get(topologyPO.sidePane.detailsTab.labels).should('be.visible');
    cy.get(topologyPO.sidePane.detailsTab.labels)
      .find('a [data-test="label-key"]')
      .contains(new RegExp(`^${key}$`, 'g'))
      .should('not.exist');
  },
);

Then('key, value columns are displayed with respective text fields', () => {
  cy.byTestID('pairs-list-name').its('length').should('be.gte', 1);
  cy.byTestID('pairs-list-value').its('length').should('be.gte', 1);
});

Then('Add more link is enabled', () => {
  editAnnotations.add();
});

Then(
  'user can see the annotation {string} in the Details tab of the Sidebar of {string}',
  (numOfAnnotations: string, serviceName: string) => {
    cy.byLegacyTestID('base-node-handler').find('g.odc-resource-icon').click({ force: true });
    cy.log(numOfAnnotations, serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
  },
);

Then('details tab displayed with Revision Details and Conditions sections', () => {
  topologyPage.revisionDetails.details.verifyRevisionSummary();
  topologyPage.revisionDetails.details.verifyConditionsSection();
});

Then(
  'Revision details contains fields like Name, Namespace, Labels, Annotations, Created At, Owner',
  () => {
    cy.get('[data-test-selector="details-item-label__Name"]').should('be.visible');
    cy.get('[data-test-selector="details-item-label__Namespace"]').should('be.visible');
    cy.get('[data-test-selector="details-item-label__Labels"]').should('be.visible');
    cy.get('[data-test-selector="details-item-label__Annotations"]').should('be.visible');
    cy.get('[data-test-selector="details-item-label__Created at"]').should('be.visible');
    cy.get('[data-test-selector="details-item-label__Owner"]').should('be.visible');
  },
);

Then(
  'user is able to see message {string} in modal with header {string}',
  (message: string, header: string) => {
    modal.modalTitleShouldContain(header);
    deleteRevision.verifyMessage(message);
    modal.cancel();
  },
);

Then(
  'number of Annotations increased to {string} in revision side bar details of service {string}',
  (numOfAnnotations: string, serviceName: string) => {
    cy.byLegacyTestID('base-node-handler').find('g.odc-resource-icon').click({ force: true });
    cy.log(serviceName);
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyNumberOfAnnotations(numOfAnnotations);
  },
);

Then('modal with alert description {string} appears', (alertDescription: string) => {
  cy.get('h4.pf-c-alert__title').should('contain.text', alertDescription);
});

Then('user clicks the save button on the "Edit annotations" modal', () => {
  cy.get('[data-test="confirm-action"]').click();
});

Then(
  'verify the number of annotations equal to {string} in side bar details knative revision',
  (numOfAnnotations: string) => {
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyNumberOfAnnotations(numOfAnnotations);
  },
);

Then('user clicks on "remove" icon for the annotation with key {string}', (key: string) => {
  cy.get(`[value="${key}"]`)
    .parent()
    .parent()
    .find('.pairs-list__action')
    .find('[data-test="delete-button"]')
    .click();
});

When(
  'user selects {string} option from knative revision context menu of knative service {string}',
  (option: string, serviceName: string) => {
    topologyPage.getRevisionNode(serviceName).first().trigger('contextmenu', { force: true });
    cy.byTestActionID(option).click();
  },
);
