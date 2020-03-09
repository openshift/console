import { browser, ExpectedConditions as EC, element, by } from 'protractor';
// import { config } from '@console/internal-integration-tests/protractor.conf';
const waitForElement = 5000;
// config.jasmineNodeOpts.defaultTimeoutInterval;

  // Enter the data in textbox by passing parameters like element finder property and text
  export async function enterText(ele: any, text: string, timeoutInMilliseconds = waitForElement) {
    browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.visibilityOf(ele), timeoutInMilliseconds, `${ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await ele.clear();
    await ele.sendKeys(text);
  }

  export async function mouseHoverClick(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.presenceOf(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.actions().mouseMove(ele).click().perform();
  }

  export async function selectByVisibleText(ele: any, drpdownListvalue: string, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.visibilityOf(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await ele.click();
    await browser.wait(EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu'))), timeoutInMilliseconds);
    await element(by.cssContainingText('li button.pf-c-dropdown__menu-item', drpdownListvalue)).click();
  }

  export async function selectByIndex(ele: any, index: number = 0, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await ele.click();
    await browser.wait(EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu')), timeoutInMilliseconds, `Unable to view the dropdown options even after ${timeoutInMilliseconds} ms`));
    await element.all(by.css('li button.pf-c-dropdown__menu-item')).get(index).click();
  }

  export async function selectCheckBox(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    const result = await verifyCheckBox(ele)
    if(result === false) {
      await ele.click(); 
    } else {
      console.log('Check Box is already selected');
    }
  }

  export async function verifyCheckBox(ele: any, timeoutInMilliseconds = waitForElement) {
    let result: boolean;
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    if(ele.getAttribute('value') === 'true') {
      result = true;
      console.log('Check Box is already selected');
    } else {
      result = false;
    }
    return result;
  }

