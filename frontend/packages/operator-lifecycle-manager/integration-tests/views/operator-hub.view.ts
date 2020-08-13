import { browser, $, ExpectedConditions as until, by, element } from 'protractor';

export const operatorModal = $('.pf-c-modal-box');
export const operatorModalBody = $('[data-test-id="operator-modal-box"]');
export const operatorModalHeader = $('[data-test-id="operator-modal-header"]');
export const operatorModalIsLoaded = () =>
  browser.wait(until.presenceOf(operatorModalBody)).then(() => browser.sleep(500));
export const operatorModalTitle = operatorModalHeader.$('.catalog-item-header-pf-title');
export const operatorModalInstallBtn = $('[data-test-id="operator-install-btn"]');
export const operatorModalUninstallBtn = $('[data-test-id="operator-uninstall-btn"]');
export const closeOperatorModal = () => operatorModal.$('.close').click();
export const operatorModalIsClosed = () =>
  browser.wait(until.not(until.presenceOf(operatorModal)), 1000).then(() => browser.sleep(500));
export const viewInstalledOperator = () =>
  $('.co-hint-block')
    .element(by.linkText('View it here.'))
    .click();

export const createSubscriptionFormTitle = element(by.cssContainingText('h1', 'Install Operator'));
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
export const ownNamespaceInstallMode = $('input[value="OwnNamespace"]');
export const createSubscriptionError = $('.pf-c-alert.pf-m-danger');

export const installNamespaceDropdown = $('.dropdown--full-width');
export const installNamespaceDropdownBtn = installNamespaceDropdown.$('.pf-c-dropdown__toggle');
export const installNamespaceDropdownFilter = (filter: string) =>
  installNamespaceDropdown
    .$('.dropdown-menu__filter')
    .$('input')
    .sendKeys(filter);
export const installNamespaceDropdownSelect = (namespace: string) =>
  installNamespaceDropdown.element(
    by.cssContainingText('a .co-resource-item__resource-name', namespace),
  );

export const communityWarningModal = $('.co-modal-ignore-warning');
export const operatorCommunityWarningIsLoaded = () =>
  browser.wait(until.presenceOf(communityWarningModal), 1000).then(() => browser.sleep(500));
export const operatorCommunityWarningIsClosed = () =>
  browser
    .wait(until.not(until.presenceOf(communityWarningModal)), 1000)
    .then(() => browser.sleep(500));
export const closeCommunityWarningModal = () => communityWarningModal.$('.pf-m-secondary').click();
export const acceptCommunityWarningModal = () => communityWarningModal.$('.pf-m-primary').click();
export const acceptForeverCommunityWarningModal = () =>
  $('.co-modal-ignore-warning__checkbox')
    .$('input')
    .click()
    .then(() => acceptCommunityWarningModal());
export const viewInstalledOperatorsBtn = $('[data-test="view-installed-operators-btn"]');
export const operatorInstallPageLoaded = () =>
  browser.wait(until.presenceOf(viewInstalledOperatorsBtn), 60000);
