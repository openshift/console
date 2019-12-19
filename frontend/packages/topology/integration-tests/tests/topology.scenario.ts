import { protractor, browser, $, ExpectedConditions as until } from 'protractor';
import {
  appHost,
  checkLogs,
  checkErrors,
} from '@console/internal-integration-tests/protractor.conf';
import {
  navigateImportFromGit,
  setBuilderImage,
  enterGitRepoUrl,
  addApplication,
  applicationName,
  appName,
  builderImage,
  createButton,
  builderImageVersionName,
  addApplicationWithExistingApps,
} from '../../../dev-console/integration-tests/views/git-import-flow.view';
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
} from '../views/topology.view';
import {
  newApplicationShortName,
  newAppShortName,
} from '../../../dev-console/integration-tests/views/new-app-name.view';
import {
  switchPerspective,
  Perspective,
  sideHeader,
} from '../../../dev-console/integration-tests/views/dev-perspective.view';

describe('git import flow', () => {
  const importFromGitHeader = $('[data-test-id="resource-title"]');

  const createApp = async function(newProject: boolean, newApplication: string, newApp: string) {
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
      expect(text).toContain(newApplication);
    });

    await appName.getAttribute('value').then(function(text) {
      expect(text).toContain(newApp);
    });

    await setBuilderImage(builderImageVersionName);
    expect(builderImage.isSelected());
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
    const newApplication1 = newApplicationShortName();
    const newApp1 = newAppShortName();
    await createApp(true, newApplication1, newApp1);
    const newApplication2 = newApplicationShortName();
    const newApp2 = newAppShortName();
    await createApp(false, newApplication2, newApp2);

    // Verify Toplogy view is opened
    await browser.wait(until.presenceOf(topologyContainer));
    await browser.wait(until.presenceOf(topologyGraph));
    await browser.wait(until.presenceOf(topologyToolbar));
    await browser.wait(until.presenceOf(topologyNodes.first()));
    await expect(topologyNodes.count()).toBe(4);

    // Verify that there are zero connectors displayed in the Topology view
    await expect(topologyConnectors.count()).toBe(0);

    // Find the source app to be connected
    await expect(findNodes(newApplication1).count()).toBe(1);
    await findNode(newApplication1);
    await findWorkloadNode(newApplication1);

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

    // Verify that there is now (1) connector displayed in the Topolgy view
    await expect(topologyConnectors.count()).toBe(1);
  });
});
