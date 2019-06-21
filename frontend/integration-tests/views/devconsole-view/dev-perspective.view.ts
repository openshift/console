import { $, browser, ExpectedConditions as until, by, element } from 'protractor';

export const switcher = element(by.css('[aria-label="Application Launcher"]'));

export const applicationlLauncher = $('.pf-c-dropdown__menu.pf-m-align-right');

export const devPerspective = element(by.cssContainingText('.pf-c-dropdown__menu-item', 'Developer'));

export const adminPerspective = element(by.cssContainingText('.pf-c-dropdown__menu-item', 'Administrator'));

export enum Perspective {
  Developer = 'Developer Perspective',
  Administrator = ' Administrator Perspective',
}

export const switchPerspective = async function(perspective: Perspective) {
  await browser.wait(until.elementToBeClickable(switcher), 5000);
  await switcher.click();
  await browser.wait(until.visibilityOf(applicationlLauncher));
  switch (perspective) {
    case Perspective.Developer: {
      await browser.wait(until.elementToBeClickable(devPerspective));
      await devPerspective.click();
      break;
    }

    case Perspective.Administrator: {
      await browser.wait(until.elementToBeClickable(adminPerspective));
      await adminPerspective.click();
      break;
    }

    default: {
      throw new Error('Perspective is not valid');
    }
  }
};
