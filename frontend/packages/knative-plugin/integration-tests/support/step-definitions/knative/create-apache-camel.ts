import { Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { eventSourcesPage } from '@console/dev-console/integration-tests/support/pages';

Then('user will be redirected to page with header name {string}', (headerName: string) => {
  detailsPage.titleShouldContain(headerName);
});

Then('user is able to see CamelSource event type', () => {
  eventSourcesPage.verifyEventSourceType('Camel Source');
});
