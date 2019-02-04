import { $, $$, browser, ExpectedConditions as until, by, element } from 'protractor';

const BROWSER_TIMEOUT = 15000;

const inputs = $$('.form-control');
export const rowsKey = $('[placeholder="name"]');
export const rowsValue = $('[placeholder="value"]');
export const deleteBtn = $$('.pairs-list__delete-icon').first();
export const saveBtn = element(by.cssContainingText('.btn.btn-primary', 'Save'));

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

export const deleteVariable = async() => {
  await isLoaded();
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await deleteBtn.click();
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await saveBtn.click();
};
