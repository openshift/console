import { by, element, browser, ExpectedConditions as until } from 'protractor';

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

// Elements in the topology controlbar - TBD

// Navigate to topology tab
export const navigateTopology = async function() {
  await browser.wait(until.elementToBeClickable(topologyNavigate));
  await topologyNavigate.click();
};
