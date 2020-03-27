/* eslint-disable no-console, promise/catch-or-return */
import { browser, $, ExpectedConditions as until, by, element, Key } from 'protractor';
import { config } from '@console/internal-integration-tests/protractor.conf';
const waitForElement = config.jasmineNodeOpts.defaultTimeoutInterval;
import { enterText, selectByIndex, selectByVisibleText,
  } from '../utilities/elementInteractions';
import { click } from '@console/shared/src/test-utils/utils';

export const addNavigate = element(by.css('[data-test-id="+Add-header"]'));
export const gitImportButton = element(by.css('[data-test-id="import-from-git"]'));
export const gitRepoUrl = element(by.id('form-input-git-url-field'));
export const importFromGitHeader = $('[data-test-id="resource-title"]');
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
export const createButton = element(by.css('[data-test-id="import-git-create-button"]'));
export const builderImageVersionName = element(by.id('8-link'));
export const gitUrlHelper = element(by.css('div#form-input-git-url-field-helper'));
export const builderImageSelected = element(by.css('div#builder-image-selector-field button.is-selected'));

export const routingObj = {
    hostname:  element(by.id('form-input-route-hostname-field')),
    path: element(by.id('form-input-route-path-field')),
    targetPort: element(by.css('button#form-dropdown-route-targetPort-field')),
    secureRoute: element(by.css('input#form-checkbox-route-secure-field')),
    tlsTermination: element(by.css('button#form-dropdown-route-tls-termination-field')),
    insecureTraffic: element(by.css('button#form-dropdown-route-tls-insecureEdgeTerminationPolicy-field')),
    certificate: element.all(by.css('textarea[data-test-id="file-input-textarea"]')).get(0),
    privateKey: element.all(by.css('textarea[data-test-id="file-input-textarea"]')).get(1),
    caCertificate: element.all(by.css('textarea[data-test-id="file-input-textarea"]')).get(2)
}

export const buildConfigObj = {
  webHookBuildTrigger: element(by.css('input#form-checkbox-build-triggers-webhook-field')),
  buildTriggerImage: element(by.css('input#form-checkbox-build-triggers-image-field')),
  buildTriggerConfigField: element(by.css('input#form-checkbox-build-triggers-config-field')),

  // Add Environment Value
  addValue: element(by.buttonText('Add Value')), //[data-test-id="pairs-list__add-icon"]
  envName: element.all(by.css('input[placeholder="name"]')),
  envValue: element.all(by.css('input[placeholder="value"]')),
  
  // Count for Rows in Environment Variables section
  envRows: element.all(by.css('div.row.pairs-list__row')),
  deleteRowButton: element(by.css('button[data-test-id="pairs-list__delete-btn"]')),

  // Add from Config Map or Secret
  addFromConfigMap: element(by.buttonText('Add from Config Map or Secret')),
}

export const deploymentObj =  {
    deploymentTriggerImage: element(by.css('input#form-checkbox-deployment-triggers-image-field')),
    deploymentImageConfig: element(by.css('input#form-checkbox-deployment-triggers-config-field')),
    // Add Environment Value
    addValue: element(by.buttonText('Add Value')), //[data-test-id="pairs-list__add-icon"]
    envName: element.all(by.css('input[placeholder="name"]')),
    envValue: element.all(by.css('input[placeholder="value"]')),
    
    // Count for Rows in Environment Variables section
    envRows: element.all(by.css('div.row.pairs-list__row')),
    deleteRowButton: element(by.css('button[data-test-id="pairs-list__delete-btn"]')),

    // Add from Config Map or Secret
    addFromConfigMap: element(by.buttonText('Add from Config Map or Secret')),
}

export const scalingObj = {
    decrement: element(by.css('button[aria-label="Decrement"]')),
    increment: element(by.css('button[aria-label="Increment"]')),
    replicaCount: element(by.css('input#form-number-spinner-deployment-replicas-field')),
}

export const pipelineObj = {
    addPipeline: element(by.css('input#form-checkbox-pipeline-enabled-field')),
}

export const resourceLimitsObj = {
    cpuRequest: element(by.css('input[name="limits.cpu.requestValue"]')),
    cpuLimit: element(by.css('input[name="limits.cpu.limitValue"]')),
    memoryRequest: element(by.css('input[name="limits.memory.requestValue"]')),
    memoryLimit: element(by.css('input[name="limits.memory.limitValue"]')),
    cpuRequestHelperText: element(by.css('div#form-resource-limit-limits-cpu-request-field-helper')),
    cpuLimiHelperText: element(by.css('div#form-resource-limit-limits-cpu-limit-field-helper')),
    memoryRequestHelperText:element(by.css('div#form-resource-limit-limits-memory-request-field-helper')),
    memoryLimitHelperText: element(by.css('div#form-resource-limit-limits-memory-limit-field-helper'))
}

export const labelsObj = {
    labelName: element(by.css('input#tags-input'))
}

export enum AdvancedOptions {
  Routing = 'Developer Perspective',
  BuildConfig = ' Administrator Perspective',
  Deployment = 'Deployment',
  Scaling = 'Scaling',
  ResourceLimits = 'Resource Limits',
  Labels = 'Labels'
}

export enum TLSTerminationValues {
  Edge = 'Edge',
  Passthrough = 'Passthrough',
  ReEncrypt = 'Re-encrypt'
}
export const setPipelineForGitFlow = async function() {
  await pipelineObj.addPipeline.click();
}

export const selectAdvancedOptions = async function(opt: AdvancedOptions) {
  switch (opt) {
    case AdvancedOptions.Routing: {
      await click(element(by.cssContainingText('button.pf-c-button.pf-m-link.pf-m-inline', 'Routing')));
      break;
    }
    case AdvancedOptions.BuildConfig: {
      await click(element(by.cssContainingText('button.pf-c-button.pf-m-link.pf-m-inline', 'Build Configuration')));
      break;
    }
    case AdvancedOptions.Deployment: {
      await click(element(by.cssContainingText('button.pf-c-button.pf-m-link.pf-m-inline', 'Deployment')));
      break;
    }
    case AdvancedOptions.Scaling: {
      await click(element(by.cssContainingText('button.pf-c-button.pf-m-link.pf-m-inline', 'Scaling')));
      break;
    }
    case AdvancedOptions.ResourceLimits: {
      await click(element(by.cssContainingText('button.pf-c-button.pf-m-link.pf-m-inline', 'Resource Limits')));
      break;
    }
    case AdvancedOptions.Labels: {
      await click(element(by.cssContainingText('button.pf-c-button.pf-m-link.pf-m-inline', 'Labels')));
      break;
    }
    default: {
      throw new Error('Option is not available');
    }
  }
};

export const navigateImportFromGit = async function() {
  await browser.wait(until.elementToBeClickable(addNavigate), waitForElement);
  await addNavigate.click();
  await browser.wait(until.elementToBeClickable(gitImportButton));
  await gitImportButton.click();
};

export const enterGitRepoUrl = async function(gitUrl: string) {
  await browser.wait(until.presenceOf(gitRepoUrl),waitForElement);
  await gitRepoUrl.sendKeys(gitUrl);
  await element(by.css('label[for="form-input-git-url-field"]')).click();
  await browser.wait(until.visibilityOf(gitUrlHelper), waitForElement);
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

export const addApplicationInGeneral = async function(name: string, nodeName: string) {
  browser.wait(until.visibilityOf(await element(by.css('[id$=application-name-field]'))), waitForElement);
    await element(by.css('[id$=application-name-field]')).getTagName()
    .then(async(tagName) => {
      if(tagName.includes('button')) {
        await addApplicationWithExistingApps(name, nodeName);
      }  else {
        await addApplication(name, nodeName);
      }          
    })   
}

export const setBuilderImage = async function() {
  await builderImage.click();
};

// Automating Advanced options present in git import flow
export const setRouting = async function(hostname:string, path: string) {
  await enterText(routingObj.hostname, hostname);
  await enterText(routingObj.path, path);
  await selectByIndex(routingObj.targetPort);
};

export const setSecureRoute = async function(tlsTerminationValue: TLSTerminationValues, insecureTrafficValue: string = 'None') {
  // if(tlsTerminationValue ==TLSTerminationValues.Edge || tlsTerminationValue ==TLSTerminationValues.ReEncrypt) {
    await click(routingObj.secureRoute).then(async() => {
    await browser.wait(until.elementToBeClickable(routingObj.tlsTermination), waitForElement, `Unable to view the TLS termination dropdown field, even after ${waitForElement} ms `)
    await selectByVisibleText(routingObj.tlsTermination, tlsTerminationValue);
    // await routingObj().certificate.sendKeys('a');
    // await routingObj().privateKey.sendKeys();
    // await routingObj().caCertificate.sendKeys();
    await selectByVisibleText(routingObj.insecureTraffic, insecureTrafficValue);
    });
  // } else if(tlsTerminationValue ==TLSTerminationValues.Passthrough) {
  //   await click(routingObj().secureRoute).then(async() => {
  //     await browser.wait(until.elementToBeClickable(routingObj().tlsTermination), waitForElement, `Unable to view the TLS termination dropdown field, even after ${waitForElement} ms `)
  //     await selectByVisibleText(routingObj().tlsTermination, tlsTerminationValue);
  //     await selectByVisibleText(routingObj().insecureTraffic, insecureTrafficValue);
  //   });
  // } else {
  //   throw new Error('Some thing went wrong');
  // }
}

export const setEnvVariables = async function(envName: string, envValue: string, index = 0) {
  await buildConfigObj.envRows.count().then(async(count: number) => {
    if(count === 1) {
      await enterText(buildConfigObj.envName.get(index), envName);
      await enterText(buildConfigObj.envValue.get(index), envValue);
    }
  })
}
export const setBuildConfig = async function(envName: string, envValue: string) {
    await setEnvVariables(envName, envValue, 0);
}

export const setDeployment = async function(envName: string, envValue: string) {
    await setEnvVariables(envName, envValue, 1);
}

export const setScaling = async function(replicaCount) {
  await enterText(scalingObj.replicaCount, replicaCount);
}

export const setResources = async function(cpuRequest, cpuLimit, memoryRequest, memoryLimit) {
  await enterText(resourceLimitsObj.cpuRequest, cpuRequest);
  await enterText(resourceLimitsObj.cpuLimit, cpuLimit);
  await enterText(resourceLimitsObj.memoryRequest, memoryRequest);
  await enterText(resourceLimitsObj.memoryLimit, memoryLimit);
}

export const setLabel = async function(labelName) {
  await enterText(labelsObj.labelName, labelName);
}

export const clicKOnCreateButton = async function() {
  await browser.wait(until.elementToBeClickable(createButton), waitForElement);
  await createButton.click();
}
