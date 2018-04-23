/* eslint-disable no-undef, no-unused-vars */

import { $$, by, browser, ExpectedConditions as until } from 'protractor';

export const navSections = $$('.navigation-container__section:not(.navigation-container__section--cluster-picker)');

export const navSectionFor = (name: string) => navSections.filter((_, i) => $$('.navigation-container__section__title').get(i).getText()
  .then(text => text === name)).first();

export const clickNavLink = (path: [string, string]) => navSectionFor(path[0]).click()
  .then(() => browser.wait(until.visibilityOf(navSectionFor(path[0]).element(by.linkText(path[1])))))
  .then(() => navSectionFor(path[0]).element(by.linkText(path[1])).click());

export const activeLink = $$('.co-m-nav-link.active');
