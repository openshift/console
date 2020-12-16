/* eslint-disable no-console, promise/catch-or-return */
import { browser, ExpectedConditions as until, by, element, Key } from 'protractor';

export const addNavigate = element(by.css('[data-test-id="+Add-header"]'));
export const gitImportButton = element(by.css('[data-test-id="import-from-git"]'));
export const gitRepoUrl = element(by.id('form-input-git-url-field'));

export const applicationNameField = element(by.id('form-input-application-name-field'));

export const applicationSelector = element(by.id('form-dropdown-application-name-field'));
export const applicationDropdown = element(
  by.className('dropdown-menu__autocomplete-filter pf-c-dropdown__menu dropdown-menu--text-wrap'),
);

export const createApplication = element(by.id('#CREATE_APPLICATION_KEY#-link'));
export const applicationName = element(by.css('[data-test-id="application-form-app-input"]'));
export const appName = element(by.css('[data-test-id="application-form-app-name"]'));

export const builderImage = element(
  by.cssContainingText('.pf-c-card.odc-builder-image-card', 'Node.js'),
);
export const buildImageVersion = element(by.id('form-dropdown-image-tag-field'));
export const createButton = element(by.css('[data-test-id="import-git-form"]')).element(
  by.css('[data-test-id="submit-button"]'),
);
export const builderImageVersionName = element(by.id('8-link'));

export const navigateImportFromGit = async function() {
  await browser.wait(until.elementToBeClickable(addNavigate), 5000);
  await addNavigate.click();
  await browser.wait(until.elementToBeClickable(gitImportButton));
  await gitImportButton.click();
};

export const enterGitRepoUrl = async function(gitUrl: string) {
  await browser.wait(until.presenceOf(gitRepoUrl));
  await gitRepoUrl.sendKeys(gitUrl);
};

export const safeSendKeys = async function(
  uiElement: any,
  uiElementName: string,
  newValue: string,
) {
  /* Note on the use of the SendKeys Protractor function: There is a widely reported
     bug in SendKeys where the function randomly drops characters. Most of the
     workarounds for this bug involve sending individual characters one-by-one,
     separated by calls to browser.sleep() or calls to Browser.executeScript
     to bypass the Protractor API. In our testing, we found neither of these approaches
     to be acceptable as we do not want to introduce sleep statements and calls to
     Browser.executeScript failed to retain values in text fields when buttons are
     subsequently pressed. We also found that the element.clear() function failed to
     clear text from text fields and that clearing text fields by sending a control/a
     sequence encountered the bug where characters are dropped by SendKeys. After
     experimentation, we found what *seems* to avoid most instances of characters being
     dropped by adding both "before" and "after" text in SendKeys calls. */
  await browser.wait(until.elementToBeClickable(uiElement));
  await uiElement.click();
  await uiElement.sendKeys('text was', Key.chord(Key.CONTROL, 'a'), newValue);

  uiElement.getAttribute('value').then(async function(insertedValue) {
    if (insertedValue !== newValue) {
      console.info('sendKeys failed for ', uiElementName, ' - retry', insertedValue, newValue);
      await uiElement.sendKeys('text was', Key.chord(Key.CONTROL, 'a'), newValue);

      // eslint-disable-next-line promise/no-nesting
      uiElement.getAttribute('value').then(async function(insertedValue2) {
        if (insertedValue2 !== newValue) {
          console.info(
            'sendKeys failed for ',
            uiElementName,
            ' - second retry',
            insertedValue2,
            newValue,
          );
          await uiElement.sendKeys('text was', Key.chord(Key.CONTROL, 'a'), newValue);
        }
      });
    }
  });
};

export const addApplication = async function(name: string, nodeName: string) {
  // These are not visible when a user first runs the UI on an empty project
  //  await applicationSelector.click();
  //  await browser.wait(until.presenceOf(applicationDropdown));
  //  await createApplication.click();
  await applicationNameField.click();
  await safeSendKeys(applicationName, 'applicationName', name);
  await safeSendKeys(appName, 'appName', nodeName);
};

export const addApplicationWithExistingApps = async function(name: string, nodeName: string) {
  await browser.wait(until.visibilityOf(applicationSelector));
  await browser.wait(until.elementToBeClickable(applicationSelector));
  await applicationSelector.click();
  await browser.wait(until.presenceOf(applicationDropdown));
  await createApplication.click();
  await applicationNameField.click();
  await safeSendKeys(applicationName, 'applicationName', name);
  await safeSendKeys(appName, 'appName', nodeName);
};

export const setBuilderImage = async function() {
  await builderImage.click();
};
