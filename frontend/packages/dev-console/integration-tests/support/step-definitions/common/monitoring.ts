import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu, monitoringTabs } from '../../constants';
import { navigateTo, monitoringPage } from '../../pages';

Given('user is on Observe page', () => {
  navigateTo(devNavigationMenu.Observe);
});

Given('user is at the Observe dashboard', () => {
  navigateTo(devNavigationMenu.Observe);
});

When('user navigates to Observe page', () => {
  navigateTo(devNavigationMenu.Observe);
});

When('user clicks on {string} tab', (tabName: string) => {
  monitoringPage.selectTab(tabName);
});

Given('user is on Metrics tab', () => {
  monitoringPage.selectTab(monitoringTabs.Metrics);
});
