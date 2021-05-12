import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { addPage, yamlPage, navigateTo } from '../../pages';
import { addOptions, devNavigationMenu } from '../../constants';
import { app, yamlEditor } from '../../pages/app';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';

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
