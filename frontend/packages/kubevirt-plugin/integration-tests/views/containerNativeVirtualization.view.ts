import { $, by, element } from 'protractor';

export const elmCnvOperator = element(
  by.cssContainingText('.catalog-tile-pf-title', 'Container-native virtualization Operator'),
);

export const elmCNV = element(
  by.cssContainingText('.catalog-tile-pf-title', 'Container-native virtualization'),
);
export const elmInstall = element(by.linkText('Install'));
export const namespaceButton = $('.co-namespace-selector button');
export const messageLbl = $('.cos-status-box');
export const nameFilter = $('.pf-c-form-control.co-text-filter');
export const verifyDelete = element(by.css('.co-delete-modal')).element(
  by.css('.pf-c-form-control'),
);
export const openshiftNamespaceButton = $('#openshift-cnv-link');
export const kubevirtOperatorStatus = $('.co-clusterserviceversion-row__status');
export const elmKebab = element(by.xpath("//button[@data-test-id='kebab-button']"));
export const elmUninstall = element(by.xpath("//button[@data-test-action='Uninstall Operator']"));
export const elmActionMenu = element(by.xpath("//button[@data-test-id='actions-menu-button']"));
