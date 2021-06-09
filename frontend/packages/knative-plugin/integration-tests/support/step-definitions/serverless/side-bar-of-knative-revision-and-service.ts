import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  topologyPage,
  topologySidePane,
} from '@console/topology/integration-tests/support/pages/topology';

When('user clicks on the revision of knative service {string}', (serviceName: string) => {
  cy.get('[data-test-id="base-node-handler"]', { timeout: 150000 }).should('be.visible');
  cy.byLegacyTestID('base-node-handler')
    .find('g.odc-resource-icon')
    .click({ force: true });
  cy.log(serviceName);
});

When('user clicks on Resources section', () => {
  // TODO: implement step
});

When('user clicks on Actions dropdown in top right corner of side bar', () => {});

When('user clicks on the knative service {string}', (serviceName: string) => {
  cy.get('g.odc-base-node__label')
    .should('be.visible')
    .contains(serviceName)
    .click({ force: true });
});

When('user click on the knative revision name {string}', (a: string) => {
  cy.log(a);
});

Then('side bar is displayed with heading name as {string}', (serviceName: string) => {
  topologySidePane.verifyTitle(serviceName);
});

Then('user able to see pods status as {string} by default', (podStatus: string) => {
  cy.log(podStatus);
});

// Then('name displays as {string}', (a: string) => {
//  cy.log(a)
// });

// Then('namespace displays as {string}', (a: string) => {
//  cy.log(a)
// });

// Then('Labels section contain n number of Labels', () => {
//   // TODO: implement step
// });

// Then('Annotations section contain {string}', (a: string) => {
//  cy.log(a)
// });

// Then('{string} field the date in format {string}', (a: string, b: string) => {
//  cy.log(a, b)
// });

Then(
  'user able to see the options {string}, {string}, {string}, {string}',
  (a: string, b: string, c: string, d: string) => {
    cy.log(a, b, c, d);
  },
);

Then(
  'side bar is displayed with heading name same as knative service name {string}',
  (serviceName: string) => {
    topologySidePane.verifyTitle(serviceName);
  },
);

When('user clicks on the knative service name {string}', (serviceName: string) => {
  topologyPage.componentNode(serviceName).click();
});

// Then('Name should display as {string} in topology details', (name: string) => {

// });

// Then('Namespace should display as {string} in topology details', (namespace: string) => {
//  cy.log(namespace);
// });

// Then('Labels section should contain n number of Labels in topology details', () => {

// });

// Then('Annotations section should contain {string} in topology details', (a: string) => {
//  cy.log(a)
// });

// Then('{string} field display the date in format {string} in topology details', (a: string, b: string) => {
//  cy.log(a, b,)
// });

// Then('owner field should be displayed in topology details', () => {
//   // TODO: implement step
// });

Then(
  'Name, Namespace, Labels, Annotations, Created at, Owner fields displayed  in topology details',
  () => {
    topologySidePane.verify();
    topologySidePane.selectTab('Details');
    topologySidePane.verifyFieldInDetailsTab('Name');
    topologySidePane.verifyFieldInDetailsTab('Namespace');
    topologySidePane.verifyFieldInDetailsTab('Labels');
    topologySidePane.verifyFieldInDetailsTab('Annotations');
    topologySidePane.verifyFieldInDetailsTab('Created at');
    topologySidePane.verifyFieldInDetailsTab('Owner');
    topologySidePane.close();
  },
);

Then(
  'user able to see the options Edit Labels, Edit Annotations, Edit Revision, Delete Revision',
  () => {
    // TODO: implement step
  },
);

Then(
  'user able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit NameOfWorkLoad, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service',
  () => {
    // TODO: implement step
  },
);
