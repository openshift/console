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
  addApplicationWithExistingApps,
} from '../../views/devconsole-view/git-imort-flow';

import {
  topologyContainer,
  topologyContent,
  topologyGraph,
  topologyToolbar,
  defaultGroupLabels,
} from '../../views/devconsole-view/topology.view';

import { newApplicationName, newAppName } from '../../views/devconsole-view/new-app-name.view';

import {
  switchPerspective,
  Perspective,
  sideHeader,
} from '../../views/devconsole-view/dev-perspective.view';

import { info } from 'console';


describe('git import flow', () => {
  let newApplication;
  let newApp;
  const importFromGitHeader = $('[data-test-id="resource-title"]');

  beforeAll(async () => {
    await createApp(true);
    await createApp(false);
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('topology normal flow', async () => {

    // Verify Toplogy view is opened
    await browser.wait(until.presenceOf(topologyContainer));
    await browser.wait(until.presenceOf(topologyContent));
    await browser.wait(until.presenceOf(topologyGraph));
    await browser.wait(until.presenceOf(topologyToolbar));
    await browser.wait(until.presenceOf(defaultGroupLabels.first()));

    // Verify that only (1) DeploymentCOnfig is present in the topology graph
    expect (defaultGroupLabels.count()).toBe(2);

    // Verify that the DeploymentConfig text is correct
    defaultGroupLabels.getText().then(function (text) {
      info("Verifying defaultGroupLabels = [" , text, "] [", newApplication, "]");
      expect(text).toContain(newApplication);
    });

  });

  const createApp = async function(newProject: Boolean) {

    await browser.get(`${appHost}/k8s/cluster/projects`);
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

    if (newProject) {
      await addApplication(newApplication, newApp);
    }
    else {
      await addApplicationWithExistingApps(newApplication, newApp);
    }

    applicationName.getAttribute('value').then(function (text) {
      info("Verifying applicationName attribute value = [" , text, "] [", newApplication, "]");
      expect(text).toContain(newApplication);
    });

    appName.getAttribute('value').then(function (text) {
      info("Verifying appName attribute value = [" , text, "] [", newApp, "]");
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

});
