import { $, $$, browser, ExpectedConditions as until, by, element } from 'protractor';

const BROWSER_TIMEOUT = 15000;

const inputs = $$('.pf-c-form-control');
export const rowsKey = $('[placeholder="name"]');
export const rowsValue = $('[placeholder="value"]');
export const deleteBtn = $$('[data-test-id="pairs-list__delete-btn"]').first();
export const saveBtn = element(by.cssContainingText('.pf-m-primary', 'Save'));

export const prefix = $('[data-test-id=env-prefix]');
export const resources = $$('.co-resource-item__resource-name');
const option = $$('[role="option"]');
const dropDownBtn = $$('.value-from');
const textFilter = $('[placeholder="Config Map or Secret"]');

export const isLoaded = () => browser.wait(until.presenceOf(inputs.first()), BROWSER_TIMEOUT);

export const addVariable = async (key: string, value: string) => {
  await isLoaded();
  await inputs.get(0).clear();
  await inputs.get(0).sendKeys(key);
  await inputs.get(1).clear();
  await inputs.get(1).sendKeys(value);
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await saveBtn.click();
};

export const addVariableFrom = async (
  resourceName: string,
  resourcePrefix?: string,
  getExactResource?: boolean,
) => {
  await isLoaded();
  await dropDownBtn
    .filter(async (elem) => {
      const elemText = await elem.getText();
      return elemText === 'Select a resource';
    })
    .first()
    .click();
  await textFilter.sendKeys(resourceName);
  if (getExactResource) {
    await option
      .filter(async (elem) => {
        return (await elem.$('.co-resource-item__resource-name').getText()) === resourceName;
      })
      .first()
      .click();
  } else {
    await option.first().click();
  }
  if (resourcePrefix) {
    await prefix.clear();
    await prefix.sendKeys(resourcePrefix);
  }
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await saveBtn.click();
};

export const deleteVariable = async () => {
  await isLoaded();
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await deleteBtn.click();
  await browser.wait(until.elementToBeClickable(saveBtn), BROWSER_TIMEOUT);
  await saveBtn.click();
};
