import { $, by } from 'protractor';
import { K8sKind } from '@console/internal/module/k8s/types';
import { click } from '@console/shared/src/test-utils/utils';

export const namespaceDropdownButton = $('[data-test-id="namespace-bar-dropdown"]').$('button');
export const namespaceButton = (namespace: string) => $(`#${namespace}-link`);

export const activeTab = $('li.co-m-horizontal-nav-item--active');
export const resourceHorizontalTab = (kind: K8sKind) =>
  $(`[data-test-id="horizontal-link-${kind.labelPlural}"]`);

export const modalDialog = $('.pf-c-modal-box__footer');
export const cancelDialog = modalDialog.element(by.buttonText('Cancel'));

export const getClusterNamespace = async (): Promise<string> => {
  return (await namespaceDropdownButton.getText()).split(' ')[1];
};

export const switchClusterNamespace = async (namespace: string): Promise<void> => {
  await click(namespaceDropdownButton);
  await click(namespaceButton(namespace));
};
