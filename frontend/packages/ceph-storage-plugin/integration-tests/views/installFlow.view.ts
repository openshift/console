import { $, ExpectedConditions as until, browser, $$ } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { click } from '@console/shared/src/test-utils/utils';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { MINUTE, NS, OCS_OP, SECOND, OCS_OPERATOR_NAME } from '../utils/consts';
import { waitFor, refreshIfNotVisible } from '../utils/helpers';

// Operator Hub & Installed Operators
const ocsOperator = $('.co-clusterserviceversion-logo__name__clusterserviceversion');
export const ocsOperatorStatus = $('.co-clusterserviceversion-row__status');
const installOperator = $('.pf-m-primary');
const storageClusterLink = $('article:nth-child(10) a');
const searchInputOperatorHub = $('input[placeholder="Filter by keyword..."]');
const searchInputOperators = $('input[placeholder="Filter by name..."]');

// Subscription Page
const subscribeButton = $('.pf-m-primary');
const dropdownForNamespace = $('#dropdown-selectbox');
const customNamespaceRadio = $('input[value="OwnNamespace"]');
const selectNamespace = (namespace: string) => $(`#${namespace}-Project-link`);
const statuses = $$('.co-icon-and-text');
const status = statuses.get(0);

// Create storage cluster page
const btnCreate = $('.pf-m-primary');
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
  // Wait for 3 inputs to show up
  const selectedNodes = [];
  await browser.wait(until.presenceOf($('[data-label="Role"]')), 10000);
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
    await browser.sleep(2 * SECOND);
    await click(installOperator);
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
    await subscribeButton.click();
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(searchInputOperators));
    await searchInputOperators.sendKeys(OCS_OPERATOR_NAME);
  }

  async createStorageCluster() {
    await goToInstalledOperators();
    await browser.wait(until.visibilityOf(searchInputOperators));
    await searchInputOperators.sendKeys(OCS_OPERATOR_NAME);
    await click(ocsOperator);
    // Operators page does not directly show tiles so refresh until it shows
    await refreshIfNotVisible(storageClusterLink, 5);
    await click(storageClusterLink);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    // Node list fluctautes
    await browser.sleep(20 * SECOND);
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
