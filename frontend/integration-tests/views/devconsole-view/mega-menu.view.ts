import { $, $$, browser, ExpectedConditions as until } from "protractor";

export const switcher = $("#nav-toggle");
export const megaMenu = $("div.odc-mega-menu");

export const devPerspective = $$("li.pf-c-nav__item.odc-mega-menu-item").filter(
  function(elem, index) {
    return elem.getText().then(function(text) {
      return text === "Developer";
    });
  }
);

export const adminPerspective = $$(
  "li.pf-c-nav__item.odc-mega-menu-item"
).filter(function(elem, index) {
  return elem.getText().then(function(text) {
    return text === "Administrator";
  });
});

export enum Perspective {
  Developer = "Developer Perspective",
  Administrator = " Administrator Perspective",
  MultiModalManager = "Multi-Modal Perspective"
}

export let switchPerspective = async function(perspective: Perspective) {
  await browser.ready;
  await browser.wait(until.elementToBeClickable(switcher), 10000);
  await switcher.click();
  await browser.wait(until.visibilityOf(megaMenu));
  switch (perspective) {
    case Perspective.Developer: {
      await browser.wait(until.elementToBeClickable(devPerspective.first()));
      await devPerspective.click();
      break;
    }

    case Perspective.Administrator: {
      await browser.wait(until.elementToBeClickable(adminPerspective.first()));
      await adminPerspective.click();
      break;
    }
    case Perspective.MultiModalManager: {
      //
      break;
    }
    default: {
      throw new Error("Perspective is not valid");
    }
  }
};
