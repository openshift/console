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
  setRouting,
  setBuildConfig,
  setDeployment,
  setResources,
  setLabel,
  selectAdvancedOptions,
  AdvancedOptions,
  TLSTerminationValues,
  buildConfigObj
} from '../views/git-import-flow.view';
import { verifyCheckBox} from '../utilities/elementInteractions';
import { newApplicationName, newAppName } from '../views/new-app-name.view';
import { switchPerspective, Perspective, sideHeader } from '../views/dev-perspective.view';
import { addApplicationWithExistingApps} from '../views/git-import-flow.view';

describe('git import flow', () => {
  let newApplication;
  let newApp;
  const importFromGitHeader = $('[data-test-id="resource-title"]');

  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/cluster/projects/${testName}`);
  });

  beforeEach(async () => {
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
  
  it('public git flow with advanced options - routing', async () => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await navigateImportFromGit();
    await browser.wait(until.textToBePresentInElement(importFromGitHeader, 'Import from git'));
    expect(importFromGitHeader.getText()).toContain('Import from git');
    await enterGitRepoUrl('https://github.com/sclorg/nodejs-ex.git');

    await appName.click();
    expect(appName.getAttribute('value')).toContain('nodejs-ex-git');
    await addApplicationWithExistingApps(newApplication, newApp);
    expect(applicationName.getAttribute('value')).toContain(newApplication);
    expect(appName.getAttribute('value')).toContain(newApp);

    // Add Advanced option - Routing
    await selectAdvancedOptions(AdvancedOptions.Routing);
    await setRouting('hostname', '/path', TLSTerminationValues);


    await browser.wait(until.elementToBeClickable(createButton), 5000);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });

  it('public git flow with advanced options - BuildConfig', async () => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await navigateImportFromGit();
    await browser.wait(until.textToBePresentInElement(importFromGitHeader, 'Import from git'));
    expect(importFromGitHeader.getText()).toContain('Import from git');
    await enterGitRepoUrl('https://github.com/sclorg/nodejs-ex.git');

    await appName.click();
    expect(appName.getAttribute('value')).toContain('nodejs-ex-git');
    await addApplicationWithExistingApps(newApplication, newApp);
    expect(applicationName.getAttribute('value')).toContain(newApplication);
    expect(appName.getAttribute('value')).toContain(newApp);

    // Add Advanced option - Routing
    await selectAdvancedOptions(AdvancedOptions.Routing);
    await setRouting('hostname', '/path');

     // Add Advanced option - Build Config
    await selectAdvancedOptions(AdvancedOptions.BuildConfig);
    expect(await verifyCheckBox(buildConfigObj().webHookBuildTrigger)).toBeTruthy();
    expect( await verifyCheckBox(buildConfigObj().buildTriggerImage)).toBeTruthy();
    expect(await verifyCheckBox(buildConfigObj().buildTriggerConfigField)).toBeTruthy();
    await setBuildConfig('envName', 'envValue');

    // Add Advanced option - Deployment
    await selectAdvancedOptions(AdvancedOptions.Deployment);
    await setDeployment('envName', 'envValue');

    // Add Advanced option - Resource Limits
    await selectAdvancedOptions(AdvancedOptions.ResourceLimits);
    await setResources(8, 8, 400, 400);

    // Add Advanced option - Label
    await selectAdvancedOptions(AdvancedOptions.Labels);
    await setLabel('label-1')

    await browser.wait(until.elementToBeClickable(createButton), 5000);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });
});
