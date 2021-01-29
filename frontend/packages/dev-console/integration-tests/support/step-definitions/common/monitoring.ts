import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '../../constants/global';
import { monitoringTabs } from '../../constants/monitoring';
import { navigateTo } from '../../pages/app';
import { monitoringPage } from '../../pages/monitoring/monitoring-page';

Given('user is on Monitoring page', () => {
  navigateTo(devNavigationMenu.Monitoring);
});

When('user navigates to Monitoring page', () => {
  navigateTo(devNavigationMenu.Monitoring);
});

When('user clicks on {string} tab', (tabName: string) => {
  monitoringPage.selectTab(tabName);
});

Given('user is on Metrics tab', () => {
  monitoringPage.selectTab(monitoringTabs.Metrics);
});
