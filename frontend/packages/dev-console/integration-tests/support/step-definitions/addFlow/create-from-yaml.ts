import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions, devNavigationMenu } from '../../constants';
import { addPage, yamlPage, navigateTo } from '../../pages';
import { app, yamlEditor } from '../../pages/app';

Given('user is at Import YAML page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.YAML);
});

When('user clicks create button on YAML page', () => {
  yamlPage.clickOnCreateButton();
  app.waitForLoad();
  detailsPage.titleShouldContain('shell-app');
});

When('user clicks on cancel button', () => {
  yamlPage.clickOnCancelButton();
});

When('user enters the {string} file data to YAML Editor', (yamlFile: string) => {
  yamlEditor.isLoaded();
  yamlEditor.clearYAMLEditor();
  yamlEditor.setEditorContent(yamlFile);
});
