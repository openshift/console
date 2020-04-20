import { by, element } from 'protractor';

export const firstKebabMenu = element.all(by.css('[data-test-id="kebab-button"]')).first();
export const actionItems = element(by.css('[data-test-id="action-items"]'));
export const editCount = element.all(
  by.cssContainingText('.pf-c-dropdown__menu-item', 'Edit Pod Count'),
);
export const machineSetsInput = element(
  by.className('pf-c-form-control co-m-number-spinner__input'),
);
export const submitCount = element(by.id('confirm-action'));
export const cellClass = element.all(by.css('[data-test-id="openshift-machine-api"]')).first();
export const pageSidebar = element(by.id('page-sidebar'));
export const installServerlessOperator = element(
  by.css('div.pf-c-modal-box.co-catalog-page__overlay.co-catalog-page__overlay--right'),
);
export const createProject = element(by.id('yaml-create'));
export const nameofProject = element(by.id('input-name'));
export const displayNameofProject = element(by.id('input-display-name'));
export const servicesValidation = element(by.id('yaml-create'));
export const serverlessNavItemValidation = element(by.css('[data-test-id="resource-title"]'));
export const routesValidation = element(
  by.cssContainingText('[data-test-id="resource-title"]', 'Routes'),
);
export const knativeServingNS = element(by.css('[data-test-id="knative-serving"]'));
export const revisionsValidation = element(
  by.cssContainingText('[data-test-id="resource-title"]', 'Revisions'),
);
export const machineCount = element(by.cssContainingText('td.col-sm-4.hidden-xs', 'of 6 machines'));
