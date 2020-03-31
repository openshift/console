import { protractor, browser, $, ExpectedConditions as until } from 'protractor';
import {
  appHost,
  checkLogs,
  checkErrors,
  testName,
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
  addApplicationWithExistingApps,
} from '../views/git-import-flow.view';
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
  navigateTopology,
  emptyStateTitle,
  namespaceBar,
} from '../views/topology.view';
import { newApplicationShortName, newAppShortName } from '../views/new-app-name.view';
import { switchPerspective, Perspective, sideHeader } from '../views/dev-perspective.view';

describe('Topology', () => {
  const importFromGitHeader = $('[data-test-id="resource-title"]');

  const createApp = async function(newProject: boolean, newApplication: string, newApp: string) {
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

    await setBuilderImage();
    expect(builderImage.isSelected());
    await browser.wait(until.elementToBeClickable(createButton), 5000);
    expect(createButton.isEnabled());
    await createButton.click();
    await browser.wait(until.urlContains(`${appHost}/topology/ns/${testName}`));
  };

  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/cluster/projects/${testName}`);
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('topology normal flow', async () => {
    // Create (2) apps, keep track of the names
    const newApplication1 = newApplicationShortName();
    const newApp1 = newAppShortName();
    await navigateTopology();
    browser.wait(until.presenceOf(namespaceBar));

    // Wait for elements of topology to load to check if it's empty or filled
    browser.sleep(5000);
    const topologyFlag = await emptyStateTitle.isPresent().then(function(result) {
      return result;
    });
    if (topologyFlag) {
      await createApp(true, newApplication1, newApp1);
    } else {
      await createApp(false, newApplication1, newApp1);
    }
    const newApplication2 = newApplicationShortName();
    const newApp2 = newAppShortName();
    await createApp(false, newApplication2, newApp2);

    // Verify Toplogy view is opened
    await browser.wait(until.presenceOf(topologyContainer));
    await browser.wait(until.presenceOf(topologyGraph));
    await browser.wait(until.presenceOf(topologyToolbar));
    await browser.wait(until.presenceOf(topologyNodes.first()));
    const topologyNodesNumber = await topologyNodes.count().then(function(value) {
      return value;
    });
    await expect(topologyNodes.count()).toBe(topologyNodesNumber);

    // Verify that there are zero connectors displayed in the Topology view
    await expect(topologyConnectors.count()).toBe(0);

    // Find the source app to be connected
    await expect(findNodes(newApplication1).count()).toBe(2);
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
