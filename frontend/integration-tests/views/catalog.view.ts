import { $, $$, browser, ExpectedConditions as until } from 'protractor';

export const categoryTabs = $$('.vertical-tabs-pf-tab > a');
export const categoryTabsPresent = () => browser.wait(until.presenceOf($('.vertical-tabs-pf-tab')));
