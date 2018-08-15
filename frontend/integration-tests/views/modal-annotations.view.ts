import { $, $$, browser, ExpectedConditions as until } from 'protractor';

const BROWSER_TIMEOUT = 15000;

const addMoreBtn = $('.btn-link');
export const cancelBtn = $$('.btn-default').filter(link => link.getText().then(text => text.startsWith('Cancel'))).first();
export const confirmActionBtn = $('#confirm-action');
const annotationRows = $$('.pairs-list__row');
export const annotationRowsKey = $$('[placeholder="key"]');
export const annotationRowsValue = $$('[placeholder="value"]');
export const annotationRowsDelete = $$('.pairs-list__delete-icon');
export const annotationDialogOverlay = $('.co-overlay');

export const isLoaded = () => browser.wait(until.presenceOf(addMoreBtn), BROWSER_TIMEOUT);

export const addAnnotation = async function ( key: string, value: string) {
  const initialRowCount = await annotationRows.count();
  await addMoreBtn.click();
  await isLoaded();
  await browser.wait(until.elementToBeClickable(annotationRowsKey.get(initialRowCount)), BROWSER_TIMEOUT);
  await annotationRowsKey.get(initialRowCount).sendKeys(key);
  await browser.wait(until.elementToBeClickable(annotationRowsValue.get(initialRowCount)), BROWSER_TIMEOUT);
  await annotationRowsValue.get(initialRowCount).sendKeys(value);
};

export const updateAnnotation = async function ( annotationKey: string, annotationValue: string) {
  let found = false;
  await annotationRowsKey.each( async function (item, index) {
    if (found) {
      return;
    }
    const annKey = await item.getAttribute('value');
    if (annKey === annotationKey) {
      await annotationRowsValue.get(index).clear();
      await annotationRowsValue.get(index).sendKeys(annotationValue);
      found = true;
    }
  });
  if (!found){
    throw new Error(`Key not found [${annotationKey}]`);
  }
};

export const deleteAnnotation = async function ( annotationKey: string) {
  let found = false;
  await annotationRowsKey.each( async function (item, index) {
    if (found) {
      return;
    }
    const annKey = await item.getAttribute('value');
    if (annKey === annotationKey) {
      await annotationRowsDelete.get(index).click();
      await isLoaded();
      found = true;
    }
  });
  if (!found) {
    throw new Error(`Key not found [${annotationKey}]`);
  }
};
