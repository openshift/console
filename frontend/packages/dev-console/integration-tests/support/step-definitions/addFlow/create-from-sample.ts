import { When } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions } from '../../constants';
import { addPage, app, samplesPage, verifyAddPage } from '../../pages';

When('user clicks on the Samples card', () => {
  verifyAddPage.verifyAddPageCard('Samples');
  addPage.selectCardFromOptions(addOptions.Samples);
});

When('user selects {string} sample from Samples', (sample: string) => {
  samplesPage.search(sample);
  samplesPage.selectCardInSamples(sample);
});

When('user is able to see the form header name as {string}', (formName) => {
  app.waitForLoad();
  detailsPage.titleShouldContain(formName);
});
