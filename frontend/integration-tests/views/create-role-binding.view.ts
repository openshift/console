import { $, browser, ExpectedConditions as until, element, by } from 'protractor';

const selectFromDropdown = async(dropdownButton, text) => {
  await dropdownButton.click();
  await browser.wait(until.presenceOf($('.dropdown--text-filter')));
  await browser.actions().sendKeys(text).perform();
  await element(by.cssContainingText('li[role=option] a', text)).click();
  await browser.wait(until.not(until.visibilityOf($('.dropdown-menu'))));
};

export const selectNamespace = (namespace) => selectFromDropdown($('#ns-dropdown'), namespace);
export const selectRole = (role) => selectFromDropdown($('#role-dropdown'), role);
export const getSelectedNamespace = () => $('#ns-dropdown .co-resource-item__resource-name').getText();
export const getSelectedRole = () => $('#role-dropdown .co-resource-item__resource-name').getText();
export const inputName = (name) => $('#role-binding-name').sendKeys(name);
export const inputSubject = (subject) => $('#subject-name').sendKeys(subject);
