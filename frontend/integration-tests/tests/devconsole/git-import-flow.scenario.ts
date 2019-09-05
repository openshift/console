import { browser, $, ExpectedConditions as until } from 'protractor';
import { appHost, checkLogs, checkErrors } from '../../protractor.conf';
import {
  navigateImportFromGit,
  setBuilderImage,
  enterGitRepoUrl,
  addApplication,
  applicationName,
  appName,
  builderImage,
  buildImageVersion,
  createButton,
  builderImageVersionName,
} from '../../views/devconsole-view/git-imort-flow';
import { newApplicationName, newAppName } from '../../views/devconsole-view/new-app-name.view';
import { switchPerspective, Perspective, sideHeader } from '../../views/devconsole-view/dev-perspective.view';

describe('git import flow', () => {
  let newApplication;
  let newApp;
  const importFromGitHeader = $('[data-test-id="resource-title"]');

  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/cluster/projects`);
    newApplication = newApplicationName();
    newApp = newAppName();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('public git normal flow', async() => {
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await navigateImportFromGit();
    await browser.wait(until.textToBePresentInElement(importFromGitHeader, 'Import from git'));
    expect(importFromGitHeader.getText()).toContain('Import from git');
    await enterGitRepoUrl('https://github.com/sclorg/nodejs-ex.git');
    expect(importFromGitHeader.getText()).toContain('Import from git');
    await appName.click();
    expect(appName.getAttribute('value')).toBe('nodejs-ex.git');
    await addApplication(newApplication, newApp);
    expect(applicationName.getAttribute('value')).toContain(newApplication);
    expect(appName.getAttribute('value')).toContain(newApp);
    await setBuilderImage(builderImageVersionName);
    expect(builderImage.isSelected());
    expect(buildImageVersion.getText()).toContain('8-RHOAR');
    await browser.wait(until.elementToBeClickable(createButton), 5000);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains('topology/ns/default'));
    expect(browser.getCurrentUrl()).toContain('topology/ns/default');
  });
});
