import { $, ExpectedConditions as until, browser, $$ } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { click } from '@console/shared/src/test-utils/utils';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { MINUTE, NS, OCS_OP, SECOND } from '../utils/consts';
import { waitFor } from '../utils/helpers';

// Operator Hub & Installed Operators
const ocsOperator = $('.co-clusterserviceversion-logo__name__clusterserviceversion');
export const ocsOperatorStatus = $('.co-clusterserviceversion-row__status');
const installOperator = $('.pf-m-primary');
const storageClusterLink = $('article:nth-child(10) a');
const searchInputOperatorHub = $('input[placeholder="Filter by keyword..."]');

// Subscription Page
const subscribeButton = $('.pf-m-primary');
const dropdownForNamespace = $('#dropdown-selectbox');
const customNamespaceRadio = $('input[value="OwnNamespace"]');
const selectNamespace = (namespace: string) => $(`#${namespace}-Project-link`);
const status = $('.co-icon-and-text');

// Create storage cluster page
const btnCreate = $('.pf-m-primary');
const selectAllBtn = $('[aria-label="Select all rows"]');
const OCS_NAME = 'ocs-operator';
const CATALOG_SRC = 'ocs-catalogsource';
const ocsLink = (elem, catalogSource) =>
  $(`a[data-test="${elem}-${catalogSource}-openshift-marketplace"]`);

// General Items
export const namespaceDropdown = $('.co-namespace-selector button');
export const openshiftStorageItem = $('#openshift-storage-link');

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

export const searchInOperatorHub = async (searchParam) => {
  await browser.wait(until.visibilityOf(searchInputOperatorHub));
  await searchInputOperatorHub.sendKeys(searchParam);
  const ocs = await ocsLink(OCS_NAME, CATALOG_SRC);
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
  const selectedNodes = [];
  const isAllSeleted = await selectAllBtn.isSelected();
  if (isAllSeleted === true) await selectAllBtn.click();
  const workerAz = [];
  await browser.wait(until.presenceOf($('[data-label="Role"]')), 10000);
  const table = $('.pf-c-table.pf-m-compact tbody');
  const rows = table.$$('tr');
  rows.each(async (row, index) => {
    const currRow = JSON.stringify(await row.getText());
    const newCurrRow = currRow.replace(/\\n/g, ' ');
    let splitedRow = [];
    splitedRow = newCurrRow.split(/\s/g);
    if (splitedRow[3] === 'worker') {
      workerAz.push(splitedRow[4]);
      await table
        .$$('input')
        .get(index)
        .click();
      selectedNodes.push(
        await table
          .$$('a')
          .get(index)
          .getText(),
      );
    }
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

  async subscribeToOperator() {
    await goToOperatorHub();
    const ocsOp = await searchInOperatorHub(OCS_OP);
    await click(ocsOp);
    await click(installOperator);
    await browser.refresh();
    await this.installOperator();
    await browser.wait(until.visibilityOf(ocsOperator));
    await waitFor(ocsOperatorStatus, 'Succeeded');
  }

  async installOperator() {
    await browser.wait(until.and(crudView.untilNoLoadersPresent), 100000);
    await customNamespaceRadio.click();
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(dropdownForNamespace));
    await dropdownForNamespace.click();
    const nsTag = selectNamespace(this.namespace);
    await nsTag.click();
    await subscribeButton.click();
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
  }

  async createStorageCluster() {
    await goToInstalledOperators();
    await click(ocsOperator);
    await click(storageClusterLink);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    // Node list fluctautes
    await browser.sleep(10 * SECOND);
    const nodes = await selectWorkerRows();
    // Fluctating
    await browser.sleep(5 * SECOND);
    await browser.wait(until.elementToBeClickable(btnCreate));
    await click(btnCreate);
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
