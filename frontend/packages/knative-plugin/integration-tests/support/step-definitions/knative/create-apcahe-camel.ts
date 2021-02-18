import { Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { eventSourcesPage } from '../../../../../dev-console/integration-tests/support/pages/add-flow/event-source-page';

Then('user will be redirected to page with header name {string}', (headerName: string) => {
  detailsPage.titleShouldContain(headerName);
});

Then('user is able to see CamelSource event type', () => {
  eventSourcesPage.verifyEventSourceType('Camel Source');
});
