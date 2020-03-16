import { browser, $, ExpectedConditions as until } from 'protractor';
import {
  appHost,
  checkLogs,
  checkErrors,
  testName,
} from '@console/internal-integration-tests/protractor.conf';
import {
  navigateImportFromGit,
  enterGitRepoUrl,
  addApplication,
  applicationName,
  appName,
  createButton,
} from '../views/git-import-flow.view';
import { newApplicationName, newAppName } from '../views/new-app-name.view';
import { switchPerspective, Perspective, sideHeader } from '../views/dev-perspective.view';
import { scrollIntoView } from '../utils/page';

describe('git import flow', () => {
  let newApplication;
  let newApp;
  const importFromGitHeader = $('[data-test-id="resource-title"]');

  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/cluster/projects/${testName}`);
    newApplication = newApplicationName();
    newApp = newAppName();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('public git normal flow', async () => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await navigateImportFromGit();
    await browser.wait(until.textToBePresentInElement(importFromGitHeader, 'Import from git'));
    expect(importFromGitHeader.getText()).toContain('Import from git');
    await enterGitRepoUrl('https://github.com/sclorg/nodejs-ex.git');

    scrollIntoView(appName);
    await appName.click();
    expect(appName.getAttribute('value')).toContain('nodejs-ex-git');
    await addApplication(newApplication, newApp);
    expect(applicationName.getAttribute('value')).toContain(newApplication);
    expect(appName.getAttribute('value')).toContain(newApp);

    await browser.wait(until.elementToBeClickable(createButton), 5000);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });
});
