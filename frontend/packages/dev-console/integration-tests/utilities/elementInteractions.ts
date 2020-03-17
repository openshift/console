import { browser, $, ExpectedConditions as EC, element, by, protractor } from 'protractor';
const waitForElement = 10000;
// config.jasmineNodeOpts.defaultTimeoutInterval;

  // Enter the data in textbox by passing parameters like element finder property and text
  export async function enterText(ele: any, text: string, timeoutInMilliseconds = waitForElement) {
    await browser.wait(EC.visibilityOf(ele), timeoutInMilliseconds, `${ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await clearText(ele);
    await ele.sendKeys(text);
  }

  // Perform click action on given element with in given time
  export async function click(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await ele.click();
  }

  // clear the text field for given element with in given time
  export async function clearText(ele:any,timeoutInMilliseconds = waitForElement) {
    await browser.wait(EC.visibilityOf(ele), timeoutInMilliseconds, `${ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await ele.click();
    await ele.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, "a"));
    await ele.sendKeys(protractor.Key.BACK_SPACE);
  }

  // It is useful in Resources section [but currently not using it]
  export async function enterTextSelectDropDown(text_ele: any, text: string, drp_ele:any, drpdownListvalue: string, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', text_ele);
    await browser.wait(EC.visibilityOf(text_ele), timeoutInMilliseconds, `${text_ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await text_ele.clear();
    await text_ele.sendKeys(text);
    await browser.executeScript('arguments[0].scrollIntoView();', drp_ele);
    await browser.wait(EC.visibilityOf(drp_ele), timeoutInMilliseconds, `${drp_ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await drp_ele.click();
    await browser.wait(EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu'))), timeoutInMilliseconds);
    await element(by.cssContainingText('li button.pf-c-dropdown__menu-item', drpdownListvalue)).click();
  }

  // Perform mouseHover on the given element and perform click action with in given time
  export async function mouseHoverClick(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.presenceOf(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.actions().mouseMove(ele).click().perform();
  }

  // Select the dropdown value from given dropdown element with in given time
  export async function selectByVisibleText(ele: any, drpdownListvalue: string, timeoutInMilliseconds = waitForElement) {
    await browser.wait(EC.visibilityOf(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await ele.click();
    await browser.wait(EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu'))), timeoutInMilliseconds);
    await element(by.cssContainingText('li button.pf-c-dropdown__menu-item', drpdownListvalue)).click();
  }

  /* Select the dropdown value based on the index for given dropdown element with in given time. If index is not provided by default 0th index is considered */
  export async function selectByIndex(ele: any, index: number = 0, timeoutInMilliseconds = waitForElement) {
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await ele.click();
    await browser.wait(EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu')), timeoutInMilliseconds, `Unable to view the dropdown options even after ${timeoutInMilliseconds} ms`));
    await element.all(by.css('li button.pf-c-dropdown__menu-item')).get(index).click();
  }

  /* Select the checkbox with in given time */
  export async function selectCheckBox(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    let result = await verifyCheckBox(ele)
    if(result == false) {
      await ele.click(); 
    } else {
      console.log('Check Box is already selected');
    }
  }

  /* Verify the checkbox is selecetd or not with in given time */
  export async function verifyCheckBox(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    if(await ele.getAttribute('value') == true) {
      console.log('Check Box is already selected');
      return true;
    } else {
      return false;
    }
  }

  // This can be used for identifying locator using data-test-id attribute 
  export const elementByDataTestID = (id: string) => $(`[data-test-id="${id}"]`);
