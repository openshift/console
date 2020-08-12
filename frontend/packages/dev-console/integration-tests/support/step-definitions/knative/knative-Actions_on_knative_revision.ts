import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

Given('open shift cluster is installed with Serverless operator', () => {
  // TODO: implement step
});

Given('user is on dev perspective topology page', () => {
  // TODO: implement step
});

Given('one workload with knative resource is available', () => {
  // TODO: implement step
});

Given('knative revision name {string} is higlighted on topology page', (a: string) => {
  cy.log(a);
});

Given('number of annotations are {string} present in side pane details tab', (a: string) => {
  cy.log(a);
});

Given('number of annotations are {string} present in side pane - details tab- annotation section', (a: string) => {
  cy.log(a);
});

Given('number of annotations are {string} present in side pane - details tab', (a: string) => {
  cy.log(a);
});

Given('service should contain multiple revisions', () => {
  // TODO: implement step
});

When('user right click on the knative revision', () => {
  // TODO: implement step
});

When('user selects {string} option from knative revision context menu', (a: string) => {
  cy.log(a);
});

When('add the label {string} to exisitng labels list in {string} popup', (a: string, b: string) => {
  cy.log(a, b);
});

When('clicks {string} button on the {string} popup', (a: string, b: string) => {
  cy.log(a, b);
});

When('removes the label {string} from exisitng labels list in {string} popup', (a: string, b: string) => {
  cy.log(a, b);
});

When('types {string} into the {string} text box', (a: string, b: string) => {
  cy.log(a, b);
});

When('click on {string} icon for the annotation with key {string} present in {string} popup', (a: string, b: string, c: string) => {
  cy.log(a, b, c);
});

When('click {string} button on the {string} popup', (a: string, b: string) => {
  cy.log(a, b);
});

When('user clicks on Details tab', () => {
  // TODO: implement step
});

When('modify the Yaml file of the Revision details page', () => {
  // TODO: implement step
});

When('user clicks {string} button on Revision Yaml page', (a: string) => {
  cy.log(a);
});

Then('user able to see context menu with options {string}, {string}, {string}, {string}', (a: string, b: string, c: string, d: string) => {
  cy.log(a, b, c, d);
});

Then('popup displays with header name {string}', (a: string) => {
  cy.log(a);
});

Then('save button is disabled', () => {
  // TODO: implement step
});

Then('the label {string} display in side pane details', (a: string) => {
  cy.log(a);
});

Then('the label {string} will not display in side pane details', (a: string) => {
  cy.log(a);
});

Then('key, value columns are displayed with respecitve text fields', () => {
  // TODO: implement step
});

Then('Add more link is enabled', () => {
  // TODO: implement step
});

Then('number of annotaions increased to {string} in revision side pane details', (a: string) => {
  cy.log(a);
});

Then('verify the number of annotaions equal to {string} in side pane details', (a: string) => {
  cy.log(a);
});

Then('verify the number of annotaions decreased to {string} in side pane details', (a: string) => {
  cy.log(a);
});

Then('details tab displayed with Revision Details and Conditions sections', () => {
  // TODO: implement step
});

Then('Revision details contains fields like Name, Namespace, Labels, Annotations, Created At, Owner', () => {
  // TODO: implement step
});

Then('the message display as {string}', (a: string) => {
  cy.log(a);
});

Then('another message display as {string}', (a: string) => {
  cy.log(a);
});

Then('popup displayed with message as {string}', (a: string) => {
  cy.log(a);
});

Then('modal should get closed on clicking {string} button', (a: string) => {
  cy.log(a);
});

Then('popup displayed with header name {string} and message as {string}', (a: string, b: string) => {
  cy.log(a, b);
});
