import { protractor, browser, $, ExpectedConditions as until } from 'protractor';
import { appHost, checkErrors, checkLogs } from '../../protractor.conf';

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
  addApplicationWithExistingApps,
} from '../../views/devconsole-view/git-import-flow';

import {
  topologyContainer,
  topologyGraph,
  topologyToolbar,
  topologyNodes,
  findNodes,
  findNode,
  findWorkloadNode,
  editAnnotations,
  addAnnotations,
  saveAnnotations,
  keyField,
  valueField,
  topologyConnectors,
} from '../../views/devconsole-view/topology.view';

import { newApplicationName, newAppName } from '../../views/devconsole-view/new-app-name.view';

import {
  switchPerspective,
  Perspective,
  sideHeader,
} from '../../views/devconsole-view/dev-perspective.view';

import { info } from 'console';

describe('git import flow', () => {
  const importFromGitHeader = $('[data-test-id="resource-title"]');

  const createApp = async function(newProject: Boolean, newApplication: string, newApp: string) {
    await browser.get(`${appHost}/k8s/cluster/projects`);

    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await navigateImportFromGit();
    await browser.wait(until.textToBePresentInElement(importFromGitHeader, 'Import from git'));
    expect(importFromGitHeader.getText()).toContain('Import from git');
    await enterGitRepoUrl('https://github.com/sclorg/nodejs-ex.git');

    await appName.click();
    expect(appName.getAttribute('value')).toContain('nodejs-ex-git');

    if (newProject) {
      await addApplication(newApplication, newApp);
    } else {
      await addApplicationWithExistingApps(newApplication, newApp);
    }

    await applicationName.getAttribute('value').then(function(text) {
      info('Verifying applicationName attribute value = [', text, '] [', newApplication, ']');
      expect(text).toContain(newApplication);
    });

    await appName.getAttribute('value').then(function(text) {
      info('Verifying appName attribute value = [', text, '] [', newApp, ']');
      expect(text).toContain(newApp);
    });

    await setBuilderImage(builderImageVersionName);
    expect(builderImage.isSelected());
    expect(buildImageVersion.getText()).toContain('8-RHOAR');
    await browser.wait(until.elementToBeClickable(createButton), 5000);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains('topology/ns/default'));
  };

  beforeAll(async () => {});

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('topology normal flow', async () => {
    // Create (2) apps, keep track of the names
    const newApplication1 = newApplicationName();
    const newApp1 = newAppName();
    await createApp(true, newApplication1, newApp1);
    const newApplication2 = newApplicationName();
    const newApp2 = newAppName();
    await createApp(false, newApplication2, newApp2);

    // Verify Toplogy view is opened
    await browser.wait(until.presenceOf(topologyContainer));
    await browser.wait(until.presenceOf(topologyGraph));
    await browser.wait(until.presenceOf(topologyToolbar));
    await browser.wait(until.presenceOf(topologyNodes.first()));
    await expect(topologyNodes.count()).toBe(4);

    // Verify that there are zero connectors displayed in the Topology view
    await topologyConnectors.count().then(function(text) {
      console.log('the connector count before = ', text);
    });
    await expect(topologyConnectors.count()).toBe(0);

    // Find the source app to be connected
    await expect(findNodes(newApplication1).count()).toBe(1);
    await findNode(newApplication1)
      .getText()
      .then(function(text) {
        console.log('the node = ', text);
      });
    await findWorkloadNode(newApplication1)
      .getText()
      .then(function(text) {
        console.log('the workload node = ', text);
      });

    // Open the modal dialog to edit the annotations
    const el = findWorkloadNode(newApplication1);
    await browser
      .actions()
      .mouseMove(el)
      .perform();
    await browser
      .actions()
      .click(protractor.Button.RIGHT)
      .perform();

    // Edit the annotations - to create a visual connection from app #1 to app #2
    await browser.wait(until.presenceOf(editAnnotations));
    await editAnnotations.click();
    await browser.wait(until.presenceOf(addAnnotations));
    await addAnnotations.click();
    await keyField.sendKeys('app.openshift.io/connects-to');
    await valueField.sendKeys(newApp2);
    await saveAnnotations.click();

    // Verify that the newly created connector is visible in the Topology view
    await browser.wait(until.presenceOf(topologyConnectors.first()));
    await topologyConnectors.count().then(function(text) {
      console.log('the connector count after = ', text);
    });

    // Verify that there is now (1) connector displayed in the Topolgy view
    await expect(topologyConnectors.count()).toBe(1);
  });
});
