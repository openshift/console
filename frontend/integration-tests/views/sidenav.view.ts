import { $$, by, browser, element, ExpectedConditions as until } from 'protractor';

const navItemPath = '.pf-c-nav > .pf-c-nav__list > .pf-c-nav__item';

export const navSectionFor = (name: string) => element(by.cssContainingText(navItemPath, name));

export const clickNavLink = async (path: [string, string]) => {
  const navSection = await navSectionFor(path[0]);
  await browser.wait(until.visibilityOf(navSection));
  const sectionHidden = await navSection.$('section').getAttribute('hidden');
  if (sectionHidden) {
    await navSection.click();
  }
  const navItem = await navSection.element(by.linkText(path[1]));
  await browser.wait(until.visibilityOf(navItem));
  await navItem.click();
};

export const activeLink = $$('.pf-c-nav__link.pf-m-current');
