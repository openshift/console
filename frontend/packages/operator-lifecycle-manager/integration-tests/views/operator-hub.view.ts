import { browser, $, ExpectedConditions as until, by, element } from 'protractor';

export const operatorModal = $('.pf-c-modal-box');
export const operatorModalBody = $('[data-test-id="operator-modal-box"]');
export const operatorModalInstallBtn = $('[data-test-id="operator-install-btn"]');
export const viewInstalledOperator = () =>
  $('.co-hint-block')
    .element(by.linkText('View it here.'))
    .click();

export const createSubscriptionFormName = $(
  '.co-clusterserviceversion-logo__name__clusterserviceversion',
);
export const createSubscriptionFormBtn = element(by.buttonText('Install'));
export const createSubscriptionFormLoaded = () =>
  browser.wait(until.visibilityOf(createSubscriptionFormBtn), 60000);
export const createSubscriptionFormInstallMode = element(
  by.cssContainingText('h5', 'Installation Mode'),
);
export const allNamespacesInstallMode = $('input[value="AllNamespaces"]');
export const createSubscriptionError = $('.pf-c-alert.pf-m-danger');

export const communityWarningModal = $('.co-modal-ignore-warning');
export const viewInstalledOperatorsBtn = $('[data-test="view-installed-operators-btn"]');
export const operatorInstallPageLoaded = () =>
  browser.wait(until.presenceOf(viewInstalledOperatorsBtn), 60000);
