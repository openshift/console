import { $, $$, by, element } from 'protractor';
import { K8sKind } from '@console/internal/module/k8s/types';
import { click } from '../utils/shared-utils';

export const namespaceDropdownButton = $('[data-test-id="namespace-bar-dropdown"]').$('button');
export const namespaceButton = (namespace: string) => $(`#${namespace}-link`);

export const activeTab = $('li.co-m-horizontal-nav-item--active');
export const resourceHorizontalTab = (model: K8sKind) =>
  $(`[data-test-id="horizontal-link-${model.labelPlural}"]`);

export const modalDialog = $('.pf-c-modal-box__footer');
export const modalOverlay = $('.co-overlay');
export const cancelDialog = modalDialog.element(by.buttonText('Cancel'));

export const getClusterNamespace = async (): Promise<string> => {
  return (await namespaceDropdownButton.getText()).split(' ')[1];
};

export const switchClusterNamespace = async (namespace: string): Promise<void> => {
  await click(namespaceDropdownButton);
  await click(namespaceButton(namespace));
};

export const dropDownItem = (text) =>
  element(by.cssContainingText('.pf-c-select__menu-item', text));
export const dropDownItemMain = (text) =>
  element(by.cssContainingText('.pf-c-select__menu-item-main', text));
export const dropDownList = $$('.pf-c-select__menu-item-main');

export const confirmButton = $('#confirm-action');
