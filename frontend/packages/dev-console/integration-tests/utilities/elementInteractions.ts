import { browser, $, ExpectedConditions as EC, element, by, protractor } from 'protractor';

const ELEMENT_WAIT = 15000;

// This can be used for identifying locator using data-test-id attribute
export const elementByDataTestID = (id: string) => $(`[data-test-id="${id}"]`);

// clear the text field for given element with in given time
export const clearText = async function(ele: any, timeoutInMilliseconds = ELEMENT_WAIT) {
  await browser.wait(
    EC.visibilityOf(ele),
    timeoutInMilliseconds,
    `${ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await browser.executeScript('arguments[0].scrollIntoView();', ele);
  await ele.click();
  await ele.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'a'));
  await ele.sendKeys(protractor.Key.BACK_SPACE);
};

// Enter the data in textbox by passing parameters like element finder property and text
export const enterText = async function(
  ele: any,
  text: string,
  timeoutInMilliseconds = ELEMENT_WAIT,
) {
  await browser.wait(
    EC.visibilityOf(ele),
    timeoutInMilliseconds,
    `${ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await browser.executeScript('arguments[0].scrollIntoView();', ele);
  await clearText(ele);
  await ele.sendKeys(text);
};

// Perform click action on given element with in given time
export const click = async function(ele: any, timeoutInMilliseconds = ELEMENT_WAIT) {
  await browser.wait(
    EC.elementToBeClickable(ele),
    timeoutInMilliseconds,
    `${ele} is not able to click, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await browser.executeScript('arguments[0].scrollIntoView();', ele);
  await ele.click();
};

// It is useful in Resources section [but currently not using it]
export const enterTextSelectDropDown = async function(
  textEle: any,
  text: string,
  drpEle: any,
  drpdownListvalue: string,
  timeoutInMilliseconds = ELEMENT_WAIT,
) {
  await browser.executeScript('arguments[0].scrollIntoView();', textEle);
  await browser.wait(
    EC.visibilityOf(textEle),
    timeoutInMilliseconds,
    `${textEle} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await textEle.clear();
  await textEle.sendKeys(text);
  await browser.executeScript('arguments[0].scrollIntoView();', drpEle);
  await browser.wait(
    EC.visibilityOf(drpEle),
    timeoutInMilliseconds,
    `${drpEle} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await drpEle.click();
  await browser.wait(
    EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu'))),
    timeoutInMilliseconds,
  );
  await element(
    by.cssContainingText('li button.pf-c-dropdown__menu-item', drpdownListvalue),
  ).click();
};

// Perform mouseHover on the given element and perform click action with in given time
export const mouseHoverClick = async function(ele: any, timeoutInMilliseconds = ELEMENT_WAIT) {
  await browser.executeScript('arguments[0].scrollIntoView();', ele);
  await browser.wait(
    EC.presenceOf(ele),
    timeoutInMilliseconds,
    `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await browser
    .actions()
    .mouseMove(ele)
    .click()
    .perform();
};

// Select the dropdown value from given dropdown element with in given time
export const selectByVisibleText = async function(
  ele: any,
  drpdownListvalue: string,
  timeoutInMilliseconds = ELEMENT_WAIT,
) {
  await browser.wait(
    EC.visibilityOf(ele),
    timeoutInMilliseconds,
    `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await browser.executeScript('arguments[0].scrollIntoView();', ele);
  await ele.click();
  await browser.wait(
    EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu'))),
    timeoutInMilliseconds,
  );
  await element(
    by.cssContainingText('li button.pf-c-dropdown__menu-item', drpdownListvalue),
  ).click();
};

/* Select the dropdown value based on the index for given dropdown element with in given time. If index is not provided by default 0th index is considered */
export const selectByIndex = async function(
  ele: any,
  index: number = 0,
  timeoutInMilliseconds = ELEMENT_WAIT,
) {
  await browser.wait(
    EC.elementToBeClickable(ele),
    timeoutInMilliseconds,
    `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await browser.executeScript('arguments[0].scrollIntoView();', ele);
  await ele.click();
  await browser.wait(
    EC.elementToBeClickable(
      element(by.css('ul.pf-c-dropdown__menu')),
      timeoutInMilliseconds,
      `Unable to view the dropdown options even after ${timeoutInMilliseconds} ms`,
    ),
  );
  await element
    .all(by.css('li button.pf-c-dropdown__menu-item'))
    .get(index)
    .click();
};

/* Verify the checkbox is selecetd or not with in given time */
export const verifyCheckBox = async function(ele: any, timeoutInMilliseconds = ELEMENT_WAIT) {
  await browser.wait(
    EC.elementToBeClickable(ele),
    timeoutInMilliseconds,
    `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await browser.executeScript('arguments[0].scrollIntoView();', ele);
  if ((await ele.getAttribute('value')) === true) {
    return true;
  }
  return false;
};

/* Select the checkbox with in given time */
export const selectCheckBox = async function(ele: any, timeoutInMilliseconds = ELEMENT_WAIT) {
  await browser.wait(
    EC.elementToBeClickable(ele),
    timeoutInMilliseconds,
    `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`,
  );
  await browser.executeScript('arguments[0].scrollIntoView();', ele);
  const result = await verifyCheckBox(ele);
  if (result === false) {
    await ele.click();
  }
};
