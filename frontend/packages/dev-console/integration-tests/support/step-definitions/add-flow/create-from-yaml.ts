import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add-flow/add-page';
import { yamlPage } from '../../pages/add-flow/yaml-page';
import { addOptions } from '../../constants/add';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';

Given('user is at Import YAML page', () => {
  naviagteTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.YAML);
});

When('user clicks on create button with default YAML', () => {
  yamlPage.clickOnCreateButton();
});

When('user clicks on cancel button with default YAML', () => {
  yamlPage.clickOnCancelButton();
});
