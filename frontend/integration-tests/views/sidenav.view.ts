import { $$, by, browser, element, ExpectedConditions as until } from 'protractor';

const navItemPath = '.pf-c-nav > .pf-c-nav__list > .pf-c-nav__item';

export const navSectionFor = (name: string) => element(by.cssContainingText(navItemPath, name));

export const switcher = element(by.css('[data-test-id="perspective-switcher-toggle"]'));

export const switcherMenu = element(by.css('[data-test-id="perspective-switcher-menu"]'));

export const devPerspective = element(
  by.cssContainingText('[data-test-id="perspective-switcher-menu-option"]', 'Developer'),
);

export const adminPerspective = element(
  by.cssContainingText('[data-test-id="perspective-switcher-menu-option"]', 'Administrator'),
);

export enum Perspective {
  Developer = 'Developer Perspective',
  Administrator = ' Administrator Perspective',
}

export const activeLink = $$('.pf-c-nav__link.pf-m-current');

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
