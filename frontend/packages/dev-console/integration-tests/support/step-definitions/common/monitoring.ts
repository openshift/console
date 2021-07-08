import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu, monitoringTabs } from '../../constants';
import { navigateTo, monitoringPage } from '../../pages';

Given('user is on Monitoring page', () => {
  navigateTo(devNavigationMenu.Observe);
});

When('user navigates to Monitoring page', () => {
  navigateTo(devNavigationMenu.Observe);
});

When('user clicks on {string} tab', (tabName: string) => {
  monitoringPage.selectTab(tabName);
});

Given('user is on Metrics tab', () => {
  monitoringPage.selectTab(monitoringTabs.Metrics);
});
