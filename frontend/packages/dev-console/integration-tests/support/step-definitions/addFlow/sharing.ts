import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions, devNavigationMenu } from '../../constants';
import { addPage, navigateTo } from '../../pages';
import { checkDeveloperPerspective } from '../../pages/functions/checkDeveloperPerspective';

Given('user is at Add page', () => {
  checkDeveloperPerspective();
  navigateTo(devNavigationMenu.Add);
});

When('user clicks on Sharing card in Add page', () => {
  addPage.selectCardFromOptions(addOptions.Sharing);
});

Then('user can see {string} page', (name: string) => {
  detailsPage.titleShouldContain(name);
});
