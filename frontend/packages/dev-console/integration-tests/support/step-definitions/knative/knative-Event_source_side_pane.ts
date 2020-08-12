import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

Given('open shift cluster is installed with Serverless operator', () => {
  // TODO: implement step
});

Given('user is on dev perspective +Add page', () => {
  // TODO: implement step
});

Given('open the project {string}', (a: string) => {
 cy.log(a)
});

Given('knative service, event source and sink connector are present in topology page', () => {
  // TODO: implement step
});

When('user clicks on event source', () => {
  // TODO: implement step
});

When('select the {string} from Action menu present in right side pane', (a: string) => {
 cy.log(a)
});

Then('side pane is dsiplays with header name as {string}', (a: string) => {
 cy.log(a)
});

Then('modal displays with the header name {string}', (a: string) => {
 cy.log(a)
});

Then('knative service dropdown is displayed', () => {
  // TODO: implement step
});
