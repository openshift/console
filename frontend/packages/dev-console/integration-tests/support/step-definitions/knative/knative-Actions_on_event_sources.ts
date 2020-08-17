import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

Given('event source {string} is higlighted on topology page', (a: string) => {
  cy.log(a);
});

Given('knative service, event source and sink connector are present in topology page', () => {
  // TODO: implement step
});

When('user right clicks on the event source', () => {
  // TODO: implement step
});

When('selects {string} from context menu', (a: string) => {
  cy.log(a);
});

Then('user able to see context menu with options {string}, {string} {string}, {string}, {string}, {string}', (a: string, b: string, c: string, d: string, e: string, f: string) => {
  cy.log(a, b, c, d, e, f);
});

Then('modal displays with the header name {string}', (a: string) => {
  cy.log(a);
});

Then('knative service dropdown is displayed', () => {
  // TODO: implement step
});
