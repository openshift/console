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
  buildConfigObj,
  addNavigate,
  routingObj,
  deploymentObj,
  resourceLimitsObj,
  setScaling,
  scalingObj,
  setSecureRoute
} from '../views/git-import-flow.view';
import { 
  // verifyCheckBox, 
  enterText} from '../utilities/elementInteractions';
import { newApplicationName, newAppName } from '../views/new-app-name.view';
import { switchPerspective, Perspective, sideHeader } from '../views/dev-perspective.view';
import { addApplicationWithExistingApps} from '../views/git-import-flow.view';
const waitForElement = 5000;

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

    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });

  /*it('Select Adanced option "Routing" and fill the details', async () => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await addNavigate.click();
    // await switchPerspective(Perspective.Developer);
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
    await setSecureRoute(TLSTerminationValues.Edge);
    expect(routingObj().certificate.isDisplayed()).toBe(true);
    expect(routingObj().caCertificate.isDisplayed()).toBe(true);
    expect(routingObj().privateKey.isDisplayed()).toBe(true);
    // await setSecureRoute(TLSTerminationValues.ReEncrypt);

    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });

  it('public git flow with advanced options - BuildConfig', async () => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await addNavigate.click();
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

     // Add Advanced option - Build Config
    await selectAdvancedOptions(AdvancedOptions.BuildConfig);
    expect(await buildConfigObj().webHookBuildTrigger.getAttribute('value')).toBe(true);
    expect( await buildConfigObj().buildTriggerImage.getAttribute('value')).toBe(true);
    expect(await buildConfigObj().buildTriggerConfigField.getAttribute('value')).toBe(true);
    await setBuildConfig('envName', 'envValue');

    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });

  it('public git flow with advanced options - Deployment', async () => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await addNavigate.click();
    // await switchPerspective(Perspective.Developer);
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

    // Add Advanced option - Deployment
    await selectAdvancedOptions(AdvancedOptions.Deployment);
    expect(await deploymentObj().deploymentTriggerImage.getAttribute('value')).toBe(true);
    expect(await deploymentObj().deploymentTriggerImage.getAttribute('value')).toBe(true);
    expect(await buildConfigObj().deleteRowButton.isEnabled()).toBe(false);
    await setDeployment('envName', 'envValue');
    expect(await buildConfigObj().deleteRowButton.isEnabled()).toBe(true);

    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });

  it('public git flow with advanced options - Resource Limits', async () => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await addNavigate.click();
    // await switchPerspective(Perspective.Developer);
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

    // Add Advanced option - Resource Limits
    await selectAdvancedOptions(AdvancedOptions.ResourceLimits);
    await enterText(resourceLimitsObj().cpuRequest, '1');
    await enterText(resourceLimitsObj().cpuLimit, '0');
    expect(resourceLimitsObj().cpuRequestHelperText).toEqual('CPU request must be less than or equal to limit.');
    expect(resourceLimitsObj().cpuLimiHelperText).toEqual('CPU limit must be greater than or equal to request.');
    await enterText(resourceLimitsObj().memoryRequest, '1');
    await enterText(resourceLimitsObj().memoryLimit, '0');
    expect(resourceLimitsObj().memoryRequestHelperText).toEqual('Memory request must be less than or equal to limit.');
    expect(resourceLimitsObj().memoryLimitHelperText).toEqual('Memory limit must be greater than or equal to request.');
    await setResources(8, 8, 400, 400);

    // Add Advanced option - Label
    await selectAdvancedOptions(AdvancedOptions.Labels);
    await setLabel('label-1')

    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });

  it('public git flow with advanced options - Scaling and Label', async () => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await addNavigate.click();
    // await switchPerspective(Perspective.Developer);
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

    // Add Advanced option - Scaling
    await selectAdvancedOptions(AdvancedOptions.Scaling);
    expect(await scalingObj().replicaCount.getAttribute('value')).toEqual(1);
    await setScaling(2);
    expect(await scalingObj().replicaCount.getAttribute('value')).toEqual(2);
    await scalingObj().increment.click();
    expect(await scalingObj().replicaCount.getAttribute('value')).toEqual(3);
    await scalingObj().decrement.click();
    expect(await scalingObj().replicaCount.getAttribute('value')).toEqual(2);

    // Add Advanced option - Label
    await selectAdvancedOptions(AdvancedOptions.Labels);
    await setLabel('label-1')

    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  }); */
});

describe('git import flow with advanced options', () => {
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

  it('add git repo details', async() => {
    newApplication = newApplicationName();
    newApp = newAppName();

    await addNavigate.click();
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
  });
  
  it('add Adanced option "Routing" details', async () => {
    // Add Advanced option - Routing
    await selectAdvancedOptions(AdvancedOptions.Routing);
    await setRouting('hostname', '/path');
    await setSecureRoute(TLSTerminationValues.Edge);
    expect(routingObj().certificate.isDisplayed()).toBe(true);
    expect(routingObj().caCertificate.isDisplayed()).toBe(true);
    expect(routingObj().privateKey.isDisplayed()).toBe(true);
    // await setSecureRoute(TLSTerminationValues.ReEncrypt);
  });

  it('add Adanced option "BuildConfig" details', async () => {
     // Add Advanced option - Build Config
    await selectAdvancedOptions(AdvancedOptions.BuildConfig);
    expect(await buildConfigObj().webHookBuildTrigger.getAttribute('value')).toBe('true');
    expect( await buildConfigObj().buildTriggerImage.getAttribute('value')).toBe('true');
    expect(await buildConfigObj().buildTriggerConfigField.getAttribute('value')).toBe('true');
    await setBuildConfig('envName', 'envValue');
  });

  it('add Adanced option "Deployment" details', async () => {
    // Add Advanced option - Deployment
    await selectAdvancedOptions(AdvancedOptions.Deployment);
    expect(await deploymentObj().deploymentTriggerImage.getAttribute('value')).toBe('true');
    expect(await deploymentObj().deploymentTriggerImage.getAttribute('value')).toBe('true');
    await setDeployment('envName', 'envValue');
  });

  it('add Adanced option "Resource Limits" details', async () => {
    // Add Advanced option - Resource Limits
    await selectAdvancedOptions(AdvancedOptions.ResourceLimits);
    await enterText(resourceLimitsObj().cpuRequest, '1');
    await enterText(resourceLimitsObj().cpuLimit, '0');
    expect(resourceLimitsObj().cpuRequestHelperText.getText()).toEqual('CPU request must be less than or equal to limit.');
    expect(resourceLimitsObj().cpuLimiHelperText.getText()).toEqual('CPU limit must be greater than or equal to request.');
    await enterText(resourceLimitsObj().memoryRequest, '1');
    await enterText(resourceLimitsObj().memoryLimit, '0');
    expect(resourceLimitsObj().memoryRequestHelperText.getText()).toEqual('Memory request must be less than or equal to limit.');
    expect(resourceLimitsObj().memoryLimitHelperText.getText()).toEqual('Memory limit must be greater than or equal to request.');
    await setResources(8, 8, 400, 400);
  });

  it('add Adanced option "Scaling" details', async () => {
    // Add Advanced option - Scaling
    await selectAdvancedOptions(AdvancedOptions.Scaling);
    expect(await scalingObj().replicaCount.getAttribute('value')).toEqual('1');
    await setScaling(2);
    expect(await scalingObj().replicaCount.getAttribute('value')).toEqual('2');
    await scalingObj().increment.click();
    expect(await scalingObj().replicaCount.getAttribute('value')).toEqual('3');
    await scalingObj().decrement.click();
    expect(await scalingObj().replicaCount.getAttribute('value')).toEqual('2');
  });

  it('add Adanced option "Label" details', async () => {
    // Add Advanced option - Label
    await selectAdvancedOptions(AdvancedOptions.Labels);
    await setLabel('label-1')
  });

  it('select create button', async() => {
    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });
});