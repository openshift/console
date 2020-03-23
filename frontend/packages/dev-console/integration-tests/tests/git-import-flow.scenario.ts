import { browser, ExpectedConditions as until } from 'protractor';
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
  setSecureRoute,
  pipelineObj,
  setPipelineForGitFlow,
  importFromGitHeader,
  addApplicationInGeneral,
  gitUrlHelper,
  builderImageSelected,
} from '../views/git-import-flow.view';
import { 
  // verifyCheckBox, 
  enterText} from '../utilities/elementInteractions';
import { newApplicationName, newAppName } from '../views/new-app-name.view';
import { switchPerspective, Perspective, sideHeader } from '../views/dev-perspective.view';
import {pipelinecheckStatus, pipelineTableBody} from '../views/pipeline.view';
import {elementByDataTestID, click} from '../utilities/elementInteractions';
const waitForElement = 5000;
import { testData } from '../testData/git-import-flow.data';
import { naviagteTo, NavigationMenu } from '../utilities/appFunctions';
import { verifyCreatedAppsInTopology, selectActionInSideBar, Actions, topologyViewObj, listViewObj } from '../views/topology.view';

describe('git import flow', () => {
  let newApplication;
  let newApp;

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
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await navigateImportFromGit();
    await browser.wait(until.textToBePresentInElement(importFromGitHeader, 'Import from git'), waitForElement);
    expect(importFromGitHeader.getText()).toContain('Import from git');
    await enterGitRepoUrl(testData.gitRepoUrl);
    debugger;
    await appName.click();
    expect(appName.getAttribute('value')).toContain('nodejs-ex-git');
    await addApplicationInGeneral(newApplication, newApp);
    expect(applicationName.getAttribute('value')).toContain(newApplication);
    expect(appName.getAttribute('value')).toContain(newApp);
    expect(await gitUrlHelper.getText()).toBe('Validated');
    await browser.wait(until.visibilityOf(builderImageSelected), waitForElement, `BuilderImage is not selected even after ${waitForElement} milliseconds`)
    expect(await builderImageSelected.isDisplayed()).toBe(true);

    await browser.wait(until.elementToBeClickable(createButton), waitForElement, `Create button is not enabled even after ${waitForElement} milliseconds`);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });
});

describe('git import flow with advanced options', () => {
  let newApplication;
  let newApp;

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
    await addNavigate.click();
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await navigateImportFromGit();
    await browser.wait(until.textToBePresentInElement(importFromGitHeader, 'Import from git'));
    expect(importFromGitHeader.getText()).toContain('Import from git');
    await enterGitRepoUrl(testData.gitRepoUrl);

    await appName.click();
    expect(appName.getAttribute('value')).toContain('nodejs-ex-git');
    await addApplicationInGeneral(newApplication, newApp);
    expect(applicationName.getAttribute('value')).toContain(newApplication);
    expect(appName.getAttribute('value')).toContain(newApp);
    expect(await gitUrlHelper.getText()).toBe('Validated');
    expect(await builderImageSelected.isDisplayed()).toBe(true);
  });
  
  it('add Adanced option "Routing" details', async () => {
    // Add Advanced option - Routing
    await selectAdvancedOptions(AdvancedOptions.Routing);
    await setRouting(testData.hostName, testData.path);
    await setSecureRoute(TLSTerminationValues.Edge);
    expect(routingObj.certificate.isDisplayed()).toBe(true);
    expect(routingObj.caCertificate.isDisplayed()).toBe(true);
    expect(routingObj.privateKey.isDisplayed()).toBe(true);
    // await setSecureRoute(TLSTerminationValues.ReEncrypt);
  });

  it('add Adanced option "BuildConfig" details', async () => {
     // Add Advanced option - Build Config
    await selectAdvancedOptions(AdvancedOptions.BuildConfig);
    expect(await buildConfigObj.webHookBuildTrigger.getAttribute('value')).toBe('true');
    expect( await buildConfigObj.buildTriggerImage.getAttribute('value')).toBe('true');
    expect(await buildConfigObj.buildTriggerConfigField.getAttribute('value')).toBe('true');
    await setBuildConfig(testData.build_envName, testData.build_envValue);
  });

  it('add Adanced option "Deployment" details', async () => {
    // Add Advanced option - Deployment
    await selectAdvancedOptions(AdvancedOptions.Deployment);
    expect(await deploymentObj.deploymentTriggerImage.getAttribute('value')).toBe('true');
    expect(await deploymentObj.deploymentTriggerImage.getAttribute('value')).toBe('true');
    await setDeployment(testData.deploy_envName, testData.deploy_envValue);
  });

  it('add Adanced option "Resource Limits" details', async () => {
    // Add Advanced option - Resource Limits
    await selectAdvancedOptions(AdvancedOptions.ResourceLimits);
    await enterText(resourceLimitsObj.cpuRequest, '1');
    await enterText(resourceLimitsObj.cpuLimit, '0');
    expect(resourceLimitsObj.cpuRequestHelperText.getText()).toEqual('CPU request must be less than or equal to limit.');
    expect(resourceLimitsObj.cpuLimiHelperText.getText()).toEqual('CPU limit must be greater than or equal to request.');
    await enterText(resourceLimitsObj.memoryRequest, '1');
    await enterText(resourceLimitsObj.memoryLimit, '0');
    expect(resourceLimitsObj.memoryRequestHelperText.getText()).toEqual('Memory request must be less than or equal to limit.');
    expect(resourceLimitsObj.memoryLimitHelperText.getText()).toEqual('Memory limit must be greater than or equal to request.');
    await setResources(testData.cpuRequest, testData.cpuLimit, testData.memoryRequest, testData.memoryLimit);
  });

  it('add Adanced option "Scaling" details', async () => {
    // Add Advanced option - Scaling
    await selectAdvancedOptions(AdvancedOptions.Scaling);
    expect(await scalingObj.replicaCount.getAttribute('value')).toEqual('1');
    await setScaling(testData.scalingLimit);
    expect(await scalingObj.replicaCount.getAttribute('value')).toEqual('2');
    await scalingObj.increment.click();
    expect(await scalingObj.replicaCount.getAttribute('value')).toEqual('3');
    await scalingObj.decrement.click();
    expect(await scalingObj.replicaCount.getAttribute('value')).toEqual('2');
  });

  it('add Adanced option "Label" details', async () => {
    // Add Advanced option - Label
    await selectAdvancedOptions(AdvancedOptions.Labels);
    await setLabel(testData.label);
  });

  // Click on create button 
  it('select create button', async() => {
    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });

  /* Navigate to topology and verify the app presence
      Select that app and delete the app 
      Note: App deletion is targetted in list view, In future, will plan it in graph view*/
  it('verify the app details and delete the component in topology', async () => {
    await naviagteTo(NavigationMenu.Topology);
    await click(topologyViewObj.switchToListView);
    const count = await verifyCreatedAppsInTopology();
    expect(count).toBeGreaterThanOrEqual(1);
    await click(listViewObj.appNames.get(0));
    await selectActionInSideBar(Actions.DeleteDeployment);
    let actualCount = await listViewObj.appNames.count();
    expect(actualCount).toBeLessThan(count);
  });

  // it('verify the app icon status and Resource displays', async() => {
  //   await click(listViewObj.switchToToplogyView);

  // });
});

// This describe block is disabled beacause "Add Pipeline" functionality is consistent
xdescribe('git import flow with pipeline creation', () => {
  let newApplication;
  let newApp;

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
  });

  it('select the add pipeline option', async () => {
    expect(pipelineObj.addPipeline.getAttribute('value')).toBe('false');
    await setPipelineForGitFlow();
    expect(pipelineObj.addPipeline.getAttribute('value')).toBe('true');
  });

  it('select create button', async() => {
    await browser.wait(until.elementToBeClickable(createButton), waitForElement);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
    expect(browser.getCurrentUrl()).toContain(`${appHost}/topology/ns/${testName}`);
  });

  it('verify the pipeline for the git flow', async () => {
       // verify the pipeline created for the current git flow
       await pipelinecheckStatus();
       await browser.wait(until.visibilityOf(pipelineTableBody), waitForElement);
       expect(await elementByDataTestID(newApp).isDisplayed()).toBe(true);
  });
});
