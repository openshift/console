import { $$, by, browser, element, ExpectedConditions as until } from 'protractor';

export const horizontalTabFor = (name: string) => element(by.cssContainingText('.co-m-horizontal-nav__menu-item', name));

export const clickHorizontalTab = (tabName: string) => browser.wait(until.visibilityOf(horizontalTabFor(tabName)))
  .then(() => horizontalTabFor(tabName).click());

export const activeTab = $$('co-m-horizontal-nav-item--active');
