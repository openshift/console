import { by, element, browser, ExpectedConditions as until } from 'protractor';
import { click, selectByVisibleText } from '../utilities/elementInteractions';
const waitForElement = 15000;

// Toppology tab in sidebar
export const topologyNavigate = element(by.css('[data-test-id="topology-header"]'));

// Namespace Bar in topology
export const namespaceBar = element(by.css('[data-test-id="namespace-bar-dropdown"]'));

// Topology is empty
export const emptyStateTitle = element(by.className('odc-empty-state__title'));

// The top-level topology container
export const topologyContainer = element(by.css('[data-id="g1"]'));

// The topology graph
export const topologyGraph = element(by.css('[data-test-id="topology"]'));

// The topology controlbar
export const topologyToolbar = element(by.className('pf-topology-control-bar'));

// Elements in the topology graph
export const dataLayerBottom = element(by.css('[data-layer-id="bottom"]'));
export const dataLayerGroups = element(by.css('[data-layer-id="groups"]'));
export const dataLayerGroups2 = element(by.css('[data-layer-id="groups2"]'));
export const dataLayerDefault = element(by.css('[data-layer-id="default"]'));
export const dataLayerTop = element(by.css('[data-layer-id="top"]'));
export const topologyNodes = element.all(by.css('[data-kind="node"]'));

// Locate a node through its data-id="group:testapp-1105-1557-1699" data-kind="node" data-type="part-of"
export const findNodes = function(nodeName: string) {
  const tempString = '[data-id="group:';
  const searchString = tempString.concat(nodeName, '"]');
  const returnNode = element.all(by.css(searchString));
  return returnNode;
};

// Locate a node through its data-id="group:testapp-1105-1557-1699" data-kind="node" data-type="part-of"
export const findNode = function(nodeName: string) {
  const tempString = '[data-id="group:';
  const searchString = tempString.concat(nodeName, '"]');
  const returnNode = element(by.css(searchString));
  return returnNode;
};

// Locate a workload node through its data-id="group:testapp-1105-1557-1699" data-kind="node" data-type="part-of"
export const findWorkloadNode = function(nodeName: string) {
  const tempString = '[data-id="group:';
  const searchString = tempString.concat(nodeName, '"]');
  const returnNode = element
    .all(by.css(searchString))
    .last()
    .element(by.css('[data-type="workload"]'));
  return returnNode;
};

// Menu of acctions available through right-click on node
export const editAnnotations = element(by.css('[data-test-action="Edit Annotations"]'));

// Modal dialog for editing annotations
export const modalDialog = element(by.className('modal-content'));

// Add a new annotation
export const addAnnotations = element(by.css('[data-test-id="pairs-list__add-btn"]'));

// Save a new annotation
export const saveAnnotations = element(by.css('[id="confirm-action"]'));

// The name (key) field and value for a new annotation
export const keyField = element.all(by.css('[placeholder="key"]')).last();
export const valueField = element.all(by.css('[placeholder="value"]')).last();

// Connection lines displayed in Topology view
export const topologyConnectors = element.all(by.css('[data-test-id="edge-handler"]'));

// empty topology form
export const emptyTopologyView = element(by.css('div.loading-box.loading-box__loaded'));

// Elements in the topology controlbar - TBD

// Navigate to topology tab
export const navigateTopology = async function() {
  await browser.wait(until.elementToBeClickable(topologyNavigate));
  await topologyNavigate.click();
};

export const sideBarObj =  {
  sideBar: element(by.css('div.pf-topology-side-bar__body')),
  Title: element(by.css('h1.co-m-pane__heading')),
  ActionsMenu: element(by.css('[data-test-id="actions-menu-button"]')),
}

export const deleteDeployPopupObj = {
  form: element(by.css('form.modal-content')),
  checkbox: element(by.css('input[type="checkbox"]')),
  cancel: element(by.css('[data-test-id="modal-cancel-action"]')),
  delete: element(by.css('#confirm-action'))
}

export enum Actions {
  EditCount = "Edit Count",
  PauseRollouts = "Pause Rollouts",
  AddStorage = "Add Storage",
  EditUpdateStrategy = "Edit Update Strategy",
  EditApplicationGrouping = "Edit Application Grouping",
  EditNode = "Edit Node",
  EditLabels = "Edit Labels",
  EditAnnotations = "Edit Annotations",
  EditDeployment = "Edit Deployment",
  DeleteDeployment = "Delete Deployment"
}

export const selectActionInSideBar = async function(action: Actions) {
  switch(action) {
    case Actions.DeleteDeployment: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.DeleteDeployment);
      await browser.wait(until.visibilityOf(deleteDeployPopupObj.form), waitForElement,`Unable to view the delete deployment popup even after ${waitForElement} milliseconds`);
      await click(deleteDeployPopupObj.delete);
      await browser.wait(until.visibilityOf(listViewObj.deleteText), waitForElement, ` status "deleting" is not displaying even after  ${waitForElement} milliseconds `);
      await browser.wait(until.stalenessOf(listViewObj.deleteText), waitForElement, `App is taking more than ${waitForElement} milliseconds to delete `);
      break;
    }
    case Actions.EditCount: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.DeleteDeployment);
      break;
    }
    case Actions.PauseRollouts: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.PauseRollouts);
      break;
    }
    case Actions.AddStorage: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.AddStorage);
      break;
    }
    case Actions.EditUpdateStrategy: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.EditUpdateStrategy);
      break;
    }
    case Actions.EditApplicationGrouping: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.EditApplicationGrouping);
      break;
    }
    case Actions.EditLabels: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.EditLabels);
      break;
    }
    case Actions.EditAnnotations: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.EditAnnotations);
      break;
    }
    case Actions.EditDeployment: {
      await selectByVisibleText(sideBarObj.ActionsMenu, Actions.EditDeployment);
      break;
    }
  }
}

export const listViewObj =  {
  workloadSection: element(by.css('div.co-m-pane')),
  firstAppName: element.all(by.css('div.list-group-item')).get(0),
  appNames: element.all(by.css('span.co-m-resource-icon.co-m-resource-deployment')),
  switchToToplogyView: element(by.css('a.pf-c-button.pf-m-plain')),
  deleteText: element(by.css('h3.project-overview__item-heading span.co-resource-item__deleting'))
}

export const topologyViewObj = {
  appCount: element.all(by.css('g.odc-base-node')),
  switchToListView: element(by.css('a.pf-c-button.pf-m-plain'))
}

export const deleteAppName = async function(nodeName:string) {
  await click(findNode(nodeName));
  await selectActionInSideBar(Actions.DeleteDeployment);
  await browser.wait(until.alertIsPresent(), waitForElement);
}

export const verifyCreatedAppsInTopology = async function() {
  await browser.wait(until.visibilityOf(listViewObj.workloadSection), waitForElement, `List view is not displayed even after ${waitForElement} milliseconds`);
  await browser.wait(until.visibilityOf(listViewObj.firstAppName),waitForElement, `App names are not displayed even after ${waitForElement} milliseconds`);
  const count = await listViewObj.appNames.count();
  return count;
}