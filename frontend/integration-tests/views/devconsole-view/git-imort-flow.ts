import { browser, ExpectedConditions as until, by, element, Key } from 'protractor';

export const addNavigate = element(by.cssContainingText('.pf-c-nav > .pf-c-nav__list > .pf-c-nav__item', "+Add"));
export const gitImportButton = element(by.css('[data-test-id="import-from-git"]'))
export const gitRepoUrl = element(by.id('form-input-git-url-field'));
export const applicationSelector = element(by.id('form-dropdown-application-name-field'));
export const applicationDropdown = element(by.className('dropdown-menu__autocomplete-filter pf-c-dropdown__menu dropdown-menu--text-wrap'));
export const createApplication = element(by.id('#CREATE_APPLICATION_KEY#-link'));
export const applicationName = element(by.css('[data-test-id="application-form-app-input"]'));
export const appName = element(by.css('[data-test-id="application-form-app-name"]'));
export const builderImage = element(by.cssContainingText('.pf-c-card.odc-builder-image-card', 'Node.js'));
export const buildImageVersion = element(by.id('form-dropdown-image-tag-field'));


export const navigateImportFromGit  = async function() {
    await browser.wait(until.elementToBeClickable(addNavigate), 5000);
    await addNavigate.click();
    await browser.wait(until.elementToBeClickable(gitImportButton), 5000);
    await gitImportButton.click();
}

export const enterGitRepoUrl = async function(gitUrl: string) {
    await browser.wait(until.presenceOf(gitRepoUrl));
    await gitRepoUrl.sendKeys(gitUrl);
}

export const addApplication = async function(name: string, nodeName: string) {
    await applicationSelector.click();
    await browser.wait(until.presenceOf(applicationDropdown));
    await createApplication.click();
    await browser.wait(until.elementToBeClickable(applicationName));
    await applicationName.sendKeys(Key.chord(Key.CONTROL, "a"), name);
    await browser.wait(until.elementToBeClickable(appName));
    await appName.sendKeys(Key.chord(Key.CONTROL, "a"), nodeName);
}

export const setBuilderImage = async function(version) {
    await builderImage.click();
    await buildImageVersion.click();
    await version.click();
}
