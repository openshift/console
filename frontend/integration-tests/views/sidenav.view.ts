/* eslint-disable no-undef, no-unused-vars */

import { $$, by, browser, element, ExpectedConditions as until } from 'protractor';

export const navSectionFor = (name: string) =>  element(by.css('.pf-c-nav__list')).element(by.linkText(name));

export const clickNavLink = (path: [string, string]) => browser.wait(until.visibilityOf(navSectionFor(path[0])))
  .then(() => navSectionFor(path[1]).isDisplayed().then((isVisible: boolean) => {
    if (!isVisible) {
        navSectionFor(path[0]).click();
        browser.wait(until.visibilityOf(navSectionFor(path[1])));
    }
  }))
  .then(() => navSectionFor(path[1]).click());

export const activeLink = $$('.pf-c-nav__link.pf-m-current');
