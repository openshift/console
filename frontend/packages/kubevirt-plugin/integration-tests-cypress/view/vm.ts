import { testName } from '../support';
import { VM_STATUS } from '../const/index';

export enum detailsTab {
  // general fields
  vmName = '[data-test-selector="details-item-value__Name"]',
  vmNS = '[data-test-selector="details-item-label__Namespace"]',
  vmLabels = '[data-test="label-list"]',
  vmDesc = '[data-test-id="details-Description"]',
  vmOS = '[data-test-id="details-Operating System"]',
  vmTemplate = '[data-test-id="details-Template"]',
  vmOwner = '[data-test-selector="details-item-value__Owner"]',
  vmStatus = '[data-test="status-text"]',
  vmPod = '[data-test-id="details-Pod"]',
  vmBootOrder = '[data-test-id="details-Boot Order"]',
  vmIP = '[data-test-id="details-IP Address"]',
  vmHostname = '[data-test-id="details-Hostname"]',
  vmTimezone = '[data-test-id="details-Time Zone"]',
  vmNode = '[data-test-id="details-Node"]',
  vmWorkProfile = '[data-test-id="details-Workload Profile"]',
}

export const waitForStatus = (status: string, timeout: number) => {
  cy.get('.co-m-horizontal-nav__menu-item')
    .contains('Details')
    .click();
  cy.get(detailsTab.vmStatus, { timeout }).should('contain', status);
  if (status === VM_STATUS.Running) {
    cy.get(detailsTab.vmName).then(($vmName) => {
      const name = $vmName.text();
      cy.waitForLoginPrompt(name, testName);
    });
  }
};
