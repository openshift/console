import { browser } from 'protractor';

export const scrollIntoView = (el) => {
  browser.executeScript((element) => {
    element.scrollIntoView();
  }, el.getWebElement());
};
