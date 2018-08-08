import { $, $$, browser, ExpectedConditions as until } from 'protractor';

const BROWSER_TIMEOUT = 15000;

const inputs = $$('.form-control');
export const rowsKey = $('[placeholder="name"]');
export const rowsValue = $('[placeholder="value"]');
export const deleteBtn = $('.pairs-list__delete-icon');
export const saveBtn = $$('.btn-primary').filter(link => link.getText().then(text => text.startsWith('Save'))).first();

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
