import { $, ExpectedConditions as until, browser, $$ } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { click, getOperatorHubCardIndex } from '@console/shared/src/test-utils/utils';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { MINUTE, NS, OCS_OP, SECOND, OCS_OPERATOR_NAME } from '../utils/consts';
import { waitFor, refreshIfNotVisible } from '../utils/helpers';

// Primary Create Button
export const primaryButton = $('.pf-m-primary');

// Operator Hub & Installed Operators
export const ocsOperator = $('a[data-test-operator-row="OpenShift Container Storage"]');
export const ocsOperatorStatus = $('.co-clusterserviceversion-row__status');
export const createLink = $('.pf-c-card__footer a');
export const searchInputOperators = $('input[placeholder="Filter by name..."]');
const searchInputOperatorHub = $('input[placeholder="Filter by keyword..."]');

// Subscription Page
const dropdownForNamespace = $('#dropdown-selectbox');
const customNamespaceRadio = $('input[value="OwnNamespace"]');
const selectNamespace = (namespace: string) => $(`#${namespace}-Project-link`);
const statuses = $$('.co-icon-and-text');
const status = statuses.get(0);

// Create storage cluster page
const selectAllBtn = $('[aria-label="Select all rows"]');
const live = process.env.OCS_LIVE;
let CATALOG_SRC = 'ocs-catalogsource';
if (live === '1') CATALOG_SRC = 'redhat-operators';
const OCS_NAME = 'ocs-operator';
const ocsLink = (elem, catalogSource) =>
  $(`a[data-test="${elem}-${catalogSource}-openshift-marketplace"]`);

// General Items
export const namespaceDropdown = $('.co-namespace-selector button');
export const openshiftStorageItem = $('#openshift-storage-link');

// Size Dropdown
export const sizeDropdown = $('button[id="ocs-service-capacity-dropdown"]');
export const optionSmallSize = $('button[id="512Gi-link"]');

// Namespace
const labelValue = 'true';
const label = `openshift.io/cluster-monitoring=${labelValue}`;

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
  await browser.wait(until.visibilityOf(searchInputOperatorHub));
  await searchInputOperatorHub.sendKeys(searchParam);
  const ocs = await ocsLink(OCS_NAME, catalogSource);
  await browser.wait(until.visibilityOf(ocs));
  return ocs;
};

export const goToWorkLoads = async () => {
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await sideNavView.clickNavLink(['Workloads', 'Pods']);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await browser.wait(until.visibilityOf(namespaceDropdown));
  await $('.co-namespace-selector button').click();
  await browser.wait(until.elementToBeClickable(openshiftStorageItem));
  await $('#openshift-storage-link').click();
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};

// Operators page
export const selectWorkerRows = async () => {
  // Wait for 3 inputs to show up
  const selectedNodes = [];
  await browser.wait(until.presenceOf($('[data-label="Role"]')), 10000);
  await browser.sleep(5 * SECOND);
  expect(await browser.wait($$('tbody tr').count())).toBeGreaterThanOrEqual(3);
  const isAllSeleted = await selectAllBtn.isSelected();
  if (isAllSeleted === true) await selectAllBtn.click();
  await browser.wait(until.not(until.elementToBeSelected(selectAllBtn)));
  const workerAz = [];
  const table = $('.pf-c-table.pf-m-compact tbody');
  const rows = table.$$('tr');
  rows.each(async (row, index) => {
    const currRow = JSON.stringify(await row.getText());
    const newCurrRow = currRow.replace(/\\n/g, ' ');
    let splitedRow = [];
    splitedRow = newCurrRow.split(/\s/g);
    if (splitedRow[3] === 'worker') {
      workerAz.push(splitedRow[4]);
      if (
        !(await $$('tbody input')
          .get(index)
          .isSelected())
      ) {
        await browser.sleep(1 * SECOND);
        await $$('tbody input')
          .get(index)
          .click();
        await browser.wait(until.elementToBeSelected($$('tbody input').get(index)));
        selectedNodes.push(
          await table
            .$$('tbody a')
            .get(index)
            .getText(),
        );
      }
    }
    await browser.sleep(SECOND);
  });
  return selectedNodes;
};

export const filterInput = $('[placeholder="Filter by name..."]');
export const goToStorageClasses = async () => {
  await sideNavView.clickNavLink(['Storage', 'Storage Classes']);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};

export class InstallCluster {
  namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  async subscribeToOperator(catalogSource = CATALOG_SRC) {
    await goToOperatorHub();
    const ocsOp = await searchInOperatorHub(OCS_OP, catalogSource);
    await click(ocsOp);
    await browser.sleep(2 * SECOND);
    await click(primaryButton);
    await browser.refresh();
    await this.installOperator();
    await browser.wait(until.visibilityOf(ocsOperator));
    // Sometimes operator changes few times its status so we will wait for
    // for 5 Succeeded status in row to be sure we have operator is
    // installed properly.
    await waitFor(ocsOperatorStatus, 'Succeeded', 5);
  }

  async installOperator() {
    await browser.wait(until.and(crudView.untilNoLoadersPresent), 100000);
    await customNamespaceRadio.click();
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(dropdownForNamespace));
    await dropdownForNamespace.click();
    const nsTag = selectNamespace(this.namespace);
    await nsTag.click();
    await primaryButton.click();
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(searchInputOperators));
    await searchInputOperators.sendKeys(OCS_OPERATOR_NAME);
  }

  async createStorageCluster() {
    await goToInstalledOperators();
    await browser.wait(until.visibilityOf(searchInputOperators));
    await searchInputOperators.sendKeys(OCS_OPERATOR_NAME);
    await click(ocsOperator);
    const storageClusterIndex = await getOperatorHubCardIndex('Storage Cluster');
    const link = $(`article:nth-child(${storageClusterIndex}) a`);
    // Operators page does not directly show tiles so refresh until it shows
    await refreshIfNotVisible(link, 5);
    await click(link);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    // Node list fluctautes
    await browser.sleep(20 * SECOND);
    const nodes = await selectWorkerRows();
    // Fluctating
    await browser.sleep(5 * SECOND);
    await click(primaryButton);
    // Let it move to the other page
    await browser.sleep(1000);
    await browser.wait(until.visibilityOf(status));
    await browser.wait(until.visibilityOf(crudView.resourceTitle));
    return nodes;
  }

  async createNamespace() {
    await browser.get(`${appHost}/k8s/cluster/namespaces`);
    await crudView.isLoaded();
    const exists = await crudView.rowForName(this.namespace).isPresent();
    if (!exists) {
      await crudView.createYAMLButton.click();
      await browser.wait(until.presenceOf($('.modal-body__field')));
      await $$('.modal-body__field')
        .get(0)
        .$('input')
        .sendKeys(NS);
      await $$('.modal-body__field')
        .get(1)
        .$('input')
        .sendKeys(label);
      await $('.modal-content')
        .$('#confirm-action')
        .click();
      await browser.wait(until.urlContains(`/${this.namespace}`), MINUTE);
    }
  }
}
