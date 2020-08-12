import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

Given('open shift cluster is installed with Serverless and eventing operator', () => {
  // TODO: implement step
});

Given('open the project namespace {string}', (a: string) => {
 cy.log(a)
});

Given('user is on dev perspective', () => {
  // TODO: implement step
});

Given('user is on Add page', () => {
  // TODO: implement step
});

Given('knative service is not available for selected namespace', () => {
  // TODO: implement step
});

Given('user is on Event Sources page', () => {
  // TODO: implement step
});

Given('knative service is available for selected namespace', () => {
  // TODO: implement step
});

When('user clicks on {string} card', (a: string) => {
 cy.log(a)
});

When('user selects {string} type', (a: string) => {
 cy.log(a)
});

When('type Resoruce APIVERSION as {string}', (a: string) => {
 cy.log(a)
});

When('type Resource KIND as {string}', (a: string) => {
 cy.log(a)
});

When('selects {string} option from Service Account Name field', (a: string) => {
 cy.log(a)
});

When('selects an option from Kantive service field', () => {
  // TODO: implement step
});

When('user clicks on Create button', () => {
  // TODO: implement step
});

When('type Container Image as {string}', (a: string) => {
 cy.log(a)
});

When('type schedule as {string}', (a: string) => {
 cy.log(a)
});

When('type Subject apiVersion as {string}', (a: string) => {
 cy.log(a)
});

When('type Subject Kind as {string}', (a: string) => {
 cy.log(a)
});

Then('user redirects to page with header name {string}', (a: string) => {
 cy.log(a)
});

Then('able to see event source types like ApiServerSource, ContainerSource, CronJobSource, PingSource, SinkBinding', () => {
  // TODO: implement step
});

Then('able to see Knative Eventing card', () => {
  // TODO: implement step
});

Then('able to see notifier with header {string}', (a: string) => {
 cy.log(a)
});

Then('message as {string}', (a: string) => {
 cy.log(a)
});

Then('page contains Resource, Mode, Service Account Name, Sink, General sections', () => {
  // TODO: implement step
});

Then('Resoruce contains App Version, Kind fields', () => {
  // TODO: implement step
});

Then('sink has Kantive service dropdown with defautl text {string}', (a: string) => {
 cy.log(a)
});

Then('Application Name, Name fields have defautl text as {string}, {string}', (a: string, b: string) => {
 cy.log(a, b,)
});

Then('Create button is disabled', () => {
  // TODO: implement step
});

Then('page contains Container, Environmental variables, Sink, General sections', () => {
  // TODO: implement step
});

Then('Container has Image, Name, Arguments text fields and Add args link', () => {
  // TODO: implement step
});

Then('Environmental variables has Name, Value fields and Add More link', () => {
  // TODO: implement step
});

Then('Application Name, Name fields will have defautl text as {string}, {string}', (a: string, b: string) => {
 cy.log(a, b,)
});

Then('page contains CronJobSource, Sink, General sections', () => {
  // TODO: implement step
});

Then('CronJobSource has Data, Scedule fields', () => {
  // TODO: implement step
});

Then('page contains PingSource, Sink, General sections', () => {
  // TODO: implement step
});

Then('PingSource has Data, Scedule fields', () => {
  // TODO: implement step
});

Then('page contains Subject, Sink, General sections', () => {
  // TODO: implement step
});

Then('Subject has apiVersion, Kind, Match Labels with Name, Value fields and Add Values link', () => {
  // TODO: implement step
});

Then('page contains CamelSource section', () => {
  // TODO: implement step
});

Then('Create button is enabled', () => {
  // TODO: implement step
});

Then('user redirects to the topology page', () => {
  // TODO: implement step
});

Then('ApiServerSource event source is created and linked to selected kantive service', () => {
  // TODO: implement step
});

Then('ContainerSource event source is created and linked to selected kantive service', () => {
  // TODO: implement step
});

Then('CronJobSource event source is created and linked to selected kantive service', () => {
  // TODO: implement step
});

Then('PingSource event source is created and linked to selected kantive service', () => {
  // TODO: implement step
});

Then('SinkBinding event source is created and linked to selected kantive service', () => {
  // TODO: implement step
});

Then('CamelSource event source is created and linked to selected kantive service', () => {
  // TODO: implement step
});
