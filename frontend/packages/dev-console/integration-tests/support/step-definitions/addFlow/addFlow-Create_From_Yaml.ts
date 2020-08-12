import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { seelctCardFromOptions, yamlPage } from '../../pages/add_page';
import { addOptions } from '../../constants/add';
import { naviagteTo } from '../../pages/app';
import { devNavigationMenu } from '../../constants/global';
import { topologyPage } from '../../pages/topology_page';

Given('user is at Import YAML page', () => {
  naviagteTo(devNavigationMenu.Add);
  seelctCardFromOptions(addOptions.YAML);
});

When('user clicks on create button wtih default yaml', () => {
  yamlPage.clickOnCreateButton();
});

When('user clicks on cancel button wtih default yaml', () => {
  yamlPage.clickOnCancelButton();
});

Then('created workload {string} is present in topology page', (name: string) => {
  topologyPage.verifyWorkloadInTopologyPage(name);
});
