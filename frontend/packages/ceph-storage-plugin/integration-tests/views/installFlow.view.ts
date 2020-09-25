import { $, ExpectedConditions as until, browser, $$ } from 'protractor';
import * as path from 'path';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { click, getOperatorHubCardIndex } from '@console/shared/src/test-utils/utils';
import { OCS_OP, SECOND, OCS_OPERATOR_NAME, SUCCESS, READY_FOR_USE } from '../utils/consts';
import { waitFor, refreshIfNotVisible, waitUntil } from '../utils/helpers';

enum Version {
  OCP_44 = 'OCP_4.4',
  OCP_45 = 'OCP_4.5',
  LATEST = 'LATEST',
}

export enum Platform {
  OCP = 'OCP',
  OCS = 'OCS',
}

export enum Mode {
  CONVERGED = 'CONVERGED',
  EXTERNAL = 'EXTERNAL',
  ATTACHED_DEVICES = 'ATTACHED_DEVICES',
}

/**
 * Env vars affect what selectors are activated and what tests are run
 */
export const LIVE = process.env.OCS_LIVE;
export const VERSION = process.env.OCP_VERSION || Version.LATEST;
export const TEST_PLATFORM = process.env.TEST_PLATFORM || Platform.OCP;
export const MODE = process.env.MODE || Mode.CONVERGED;

/**
 * All generic selectors go into Defaults
 * All OCPX.Y selectors that are not compatible with > X.(Y + 1) OCP goes into its own object.
 * Everything else in DEFAULTS
 */

const DEFAULTS = {
  primaryButton: $('.pf-m-primary'),

  // Operator Hub & Installed Operators
  ocsOperator: $('a[data-test-operator-row="OpenShift Container Storage"]'),
  ocsOperatorStatus: $('.co-clusterserviceversion-row__status'),
  createLink: $('.pf-c-card__footer a'),
  searchInputOperatorHub: $('input[placeholder="Filter by keyword..."]'),
  searchInputOperators: $('[data-test-id="list-page-search-input"]'),
  ocsOperatorInstallHeading: $('.co-clusterserviceversion-install__heading'),

  // Subscription Page
  dropdownForNamespace: $('#dropdown-selectbox'),
  customNamespaceRadio: $('input[value="OwnNamespace"]'),
  selectNamespace: (namespace: string) => $(`#${namespace}-Project-link`),

  // Create storage cluster page
  selectAllBtn: $('[data-key="0"] input'),

  CATALOG_SRC: LIVE !== '1' ? 'redhat-operators' : 'ocs-catalogsource',
  OCS_NAME: 'ocs-operator',
  ocsLink: (elem, catalogSource) =>
    $(`a[data-test="${elem}-${catalogSource}-openshift-marketplace"]`),

  // General Items
  namespaceDropdown: $('.co-namespace-selector button'),
  openshiftStorageItem: $('#openshift-storage-link'),

  // Size Dropdown
  sizeDropdown: $('button[id="ocs-service-capacity-dropdown"]'),
  optionSmallSize: $('button[id="512Gi-link"]'),

  // Namespace
  label: `openshift.io/cluster-monitoring=true`,

  nodeListHandler: async () => {
    // Node list fluctautes
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await browser.wait(until.visibilityOf($('[aria-label="Node Table"] tbody tr')));
    const rowCount = async () => $$('[aria-label="Node Table"] tbody tr').count();
    await waitUntil(rowCount, 3, 5);
  },

  getStorageClusterLink: async () => {
    const index = await getOperatorHubCardIndex('Storage Cluster');
    return $(`article:nth-child(${index + 1}) a`);
  },

  // Node names in the Node List Table
  nodeNames: $$('tbody [data-key="1"]'),
  // Node locations in the Node List Table
  nodeLocations: $$('tbody [data-key="3"'),

  // Select Installation Mode
  independentModeButton: $('input[value="External"]'),

  // Select Attached Devices Mode
  attachedDevicesMode: $('input[value="Internal - Attached Devices"]'),

  // attached devices
  LSOAlert: $('.pf-c-alert__title'),
  LSOWizard: $('.ceph-create-sc-wizard'),
  scDropdown: $('#ceph-sc-dropdown'),
  selectSC: (sc: string) => $(`#${sc}-link`),
  createNewSCBtn: $('.ceph-ocs-install__create-new-sc-btn'),
  currentStep: $('.ceph-create-sc-wizard .pf-m-current'),
  volumeSetName: $('#create-lvs-volume-set-name'),
  confirmModal: $('.pf-c-modal-box__title'),
  localVolumeSetView: $('.ceph-ocs-install__form-wrapper'),
  createStorageClusterView: $('.co-m-pane__form'),
  confirmBtn: $('.pf-c-modal-box__footer .pf-m-primary'),
  nodeList: $('.ceph-node-list__max-height'),
  errorAlert: $('.pf-m-danger'),
  nodesCntOnLVS: $('.ceph-ocs-install__stats div:first-child'),
  nodeNamesForAD: $$('tbody [data-key="0"]'),

  fileUploadButton: $('#inputButton'),
};

const OCP_44 = {
  ocsOperator: $('a[data-test-operator-row="OpenShift Container Storage"]'),
  ocsOperatorStatus: $('.co-clusterserviceversion-row__status'),
  createLink: $('.pf-c-card__footer a'),
  searchInputOperators: $('input[placeholder="Filter by name..."]'),
};

const OCP_45 = {
  independentModeButton: $('input[name="independent-mode"]'),
};

export const currentSelectors = (() => {
  switch (VERSION) {
    case Version.OCP_44:
      return Object.assign(DEFAULTS, OCP_44);
    case Version.OCP_45:
      return Object.assign(DEFAULTS, OCP_45);
    default:
      return DEFAULTS;
  }
})();

// Navigation
export const goToInstalledOperators = async () => {
  await sideNavView.clickNavLink(['Operators', 'Installed Operators']);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};

export const goToOperatorHub = async () => {
  await sideNavView.clickNavLink(['Operators', 'OperatorHub']);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};

export const searchInOperatorHub = async (searchParam, catalogSource) => {
  await browser.wait(until.visibilityOf(currentSelectors.searchInputOperatorHub));
  await currentSelectors.searchInputOperatorHub.sendKeys(searchParam);
  const ocs = await currentSelectors.ocsLink(currentSelectors.OCS_NAME, catalogSource);
  await browser.wait(until.visibilityOf(ocs));
  return ocs;
};

export const goToWorkLoads = async () => {
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await sideNavView.clickNavLink(['Workloads', 'Pods']);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await browser.wait(until.visibilityOf(currentSelectors.namespaceDropdown));
  await $('.co-namespace-selector button').click();
  await browser.wait(until.elementToBeClickable(currentSelectors.openshiftStorageItem));
  await $('#openshift-storage-link').click();
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};

// Operators page
export const selectWorkerRows = async () => {
  const isAllSeleted = await currentSelectors.selectAllBtn.isSelected();
  if (isAllSeleted === false) await click(currentSelectors.selectAllBtn);
  const nodeNames = await currentSelectors.nodeNames;
  const nodesLocations = await currentSelectors.nodeLocations;
  const selectedNodes = nodeNames.map((nodeName) => nodeName.getText());
  const workersAZ = nodesLocations.map((nodeName) => nodeName.getText());
  return { selectedNodes, workersAZ };
};

export const filterInput = $('[placeholder="Filter by name..."]');
export const goToStorageClasses = async () => {
  await sideNavView.clickNavLink(['Storage', 'Storage Classes']);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};

export class InstallCluster {
  async subscribeToOperator(catalogSource = currentSelectors.CATALOG_SRC) {
    await goToOperatorHub();
    const ocsOp = await searchInOperatorHub(OCS_OP, catalogSource);
    await click(ocsOp);
    await browser.sleep(2 * SECOND);
    await click(currentSelectors.primaryButton);
    await browser.refresh();
    await browser.wait(until.and(crudView.untilNoLoadersPresent), 100 * SECOND);
    await click(currentSelectors.primaryButton);
  }

  async checkOCSOperatorInstallation() {
    if (VERSION === 'LATEST') {
      await this.checkOCSOperatorInstallationCommon();
    } else {
      await browser.wait(until.visibilityOf(currentSelectors.searchInputOperators));
      await currentSelectors.searchInputOperators.sendKeys(OCS_OPERATOR_NAME);
      // Sometimes operator changes few times its status so we will wait for
      // for 5 Succeeded status in row to be sure we have operator is
      // installed properly.
      await waitFor(currentSelectors.ocsOperatorStatus, SUCCESS, 5);
      const text = await currentSelectors.ocsOperatorStatus.getText();
      // Operator is installed successfully
      expect(text.includes(SUCCESS)).toBe(true);
    }
  }

  async checkOCSOperatorInstallationCommon() {
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await browser.wait(until.presenceOf(currentSelectors.ocsOperatorInstallHeading));
    await waitFor(currentSelectors.ocsOperatorInstallHeading, READY_FOR_USE);
    const text = await currentSelectors.ocsOperatorInstallHeading.getText();
    // Operator is installed successfully
    expect(text.includes(READY_FOR_USE)).toBe(true);
    await click(currentSelectors.primaryButton);
  }

  async subscribeToLSOOperator() {
    await click(currentSelectors.primaryButton);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await click(currentSelectors.primaryButton);
    browser.sleep(5 * SECOND);
    await browser.refresh();
    await browser.wait(until.and(crudView.untilNoLoadersPresent), 100 * SECOND);
    await click(currentSelectors.primaryButton);
    await this.checkOCSOperatorInstallationCommon();
  }

  async storageClusterCreationCommon() {
    if (VERSION !== 'LATEST') {
      await click(currentSelectors.ocsOperator);
    }
    // In fresh clusters APIs are not shown (Last seen in OCP 4.3)
    try {
      await browser.wait(until.visibilityOf(currentSelectors.createLink), 10 * SECOND);
    } catch {
      await refreshIfNotVisible(currentSelectors.createLink, 5);
    }
    const storageClusterLink = await currentSelectors.getStorageClusterLink();
    await click(storageClusterLink);
  }

  async createConvergedStorageCluster() {
    await this.storageClusterCreationCommon();
    await currentSelectors.nodeListHandler();
    const { selectedNodes, workersAZ } = await selectWorkerRows();
    await click(currentSelectors.sizeDropdown);
    await click(currentSelectors.optionSmallSize);
    await click(currentSelectors.primaryButton);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    return { selectedNodes, workersAZ };
  }

  async selectOCSOperator() {
    await browser.wait(
      until.visibilityOf($('.co-clusterserviceversion-logo__name__clusterserviceversion')),
    );
    await click(currentSelectors.ocsOperator);
  }

  async createAttachedStorageCluster() {
    await this.storageClusterCreationCommon();
    await click(currentSelectors.attachedDevicesMode);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
  }

  async createExternalStorageCluster() {
    const UPLOAD_FILE_PATH = path.resolve(__dirname, '../mocks/testFile.json');
    await this.storageClusterCreationCommon();
    await click(currentSelectors.independentModeButton);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await currentSelectors.fileUploadButton.sendKeys(UPLOAD_FILE_PATH);
    await click(currentSelectors.primaryButton);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
  }
}
