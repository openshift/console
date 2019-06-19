import {$, $$, browser, ExpectedConditions as until} from 'protractor';

export const navSectionFor = (name: string) => $(`[data-test-nav-item="${name}"]`);

export const clickNavLink = async function(path: [string, string]) {
  await browser.wait(until.visibilityOf(navSectionFor(path[0])));
  const isVisible = await navSectionFor(path[1]).isDisplayed();
  if (!isVisible) {
    await navSectionFor(path[0]).click();
    await browser.wait(until.visibilityOf(navSectionFor(path[1])));
  }

  return await navSectionFor(path[1]).click();
};

export const activeLink = $$('.pf-c-nav__link.pf-m-current');
