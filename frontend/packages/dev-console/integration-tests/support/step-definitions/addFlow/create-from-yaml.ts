import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { addPage, yamlPage, navigateTo } from '../../pages';
import { addOptions, devNavigationMenu } from '../../constants';

Given('user is at Import YAML page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.YAML);
});

When('user clicks on create button with default YAML', () => {
  yamlPage.clickOnCreateButton();
});

When('user clicks on cancel button with default YAML', () => {
  yamlPage.clickOnCancelButton();
});
