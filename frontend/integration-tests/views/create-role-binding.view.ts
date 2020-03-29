import { $, browser, ExpectedConditions as until, element, by } from 'protractor';

const selectFromDropdown = async (dropdownButton, text) => {
  await dropdownButton.click();
  await browser.wait(until.presenceOf($('[data-test-id=dropdown-text-filter]')));
  await $('[data-test-id=dropdown-text-filter]').sendKeys(text);
  await element(by.cssContainingText('li[role=option] a', text)).click();
  await browser.wait(until.not(until.visibilityOf($('.pf-c-dropdown__menu'))));
};

export const selectNamespace = (namespace) => selectFromDropdown($('#ns-dropdown'), namespace);
export const selectRole = (role) => selectFromDropdown($('#role-dropdown'), role);
export const getSelectedNamespace = () =>
  $('#ns-dropdown .co-resource-item__resource-name').getText();
export const getSelectedRole = () => $('#role-dropdown .co-resource-item__resource-name').getText();
export const inputName = (name) => $('#role-binding-name').sendKeys(name);
export const inputSubject = (subject) => $('#subject-name').sendKeys(subject);
