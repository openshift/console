import { $, $$, browser, ExpectedConditions as until, by, element } from 'protractor';

const BROWSER_TIMEOUT = 15000;

const inputs = $$('.pf-c-form-control');
export const rowsKey = $('[placeholder="name"]');
export const rowsValue = $('[placeholder="value"]');
export const deleteBtn = $$('.pairs-list__delete-icon').first();
export const saveBtn = element(by.cssContainingText('.btn.btn-primary', 'Save'));

export const prefix = $('[data-test-id=env-prefix]');
export const resources = $$('.co-resource-item__resource-name');
const option = $$('[role="option"]');
const dropDownBtn = $$('.value-from');
const textFilter = $('[placeholder="Config Map or Secret"]');

export const isLoaded = () => browser.wait(until.presenceOf(inputs.first()), BROWSER_TIMEOUT);

export const addVariable = async(key: string, value: string) => {
  await isLoaded();
  await inputs.get(0).clear();
  await inputs.get(0).sendKeys(key);
  await inputs.get(1).clear();
  await inputs.get(1).sendKeys(value);
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await saveBtn.click();
};

export const addVariableFrom = async(resourceName: string, resourcePrefix: string) => {
  await isLoaded();
  await dropDownBtn.first().click();
  await textFilter.sendKeys(resourceName);
  await option.first().click();
  await prefix.clear();
  await prefix.sendKeys(resourcePrefix);
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await saveBtn.click();
};

export const deleteVariable = async() => {
  await isLoaded();
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await deleteBtn.click();
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await saveBtn.click();
};
