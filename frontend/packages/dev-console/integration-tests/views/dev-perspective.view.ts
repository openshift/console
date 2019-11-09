import { browser, ExpectedConditions as until, by, element, $ } from 'protractor';

export const switcher = element(by.css('[data-test-id="perspective-switcher-toggle"]'));

export const switcherMenu = element(by.css('[data-test-id="perspective-switcher-menu"]'));

export const devPerspective = element(
  by.cssContainingText('.pf-c-dropdown__menu-item', 'Developer'),
);

export const adminPerspective = element(
  by.cssContainingText('.pf-c-dropdown__menu-item', 'Administrator'),
);

export enum Perspective {
  Developer = 'Developer Perspective',
  Administrator = ' Administrator Perspective',
}

export const pageSidebar = $('#page-sidebar .pf-c-nav .pf-c-nav__list');
export const sideHeader = $('#page-sidebar .oc-nav-header h1');

export const switchPerspective = async function(perspective: Perspective) {
  await browser.wait(until.elementToBeClickable(switcher), 5000);
  await switcher.click();
  await browser.wait(until.visibilityOf(switcherMenu));
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
