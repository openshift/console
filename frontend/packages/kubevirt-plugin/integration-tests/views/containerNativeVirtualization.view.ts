import { $, by, element } from 'protractor';
export const elmCnvOperator = element(
    by.cssContainingText('.catalog-tile-pf-title', 'Container-native virtualization Operator'),
)
export const elmInstall = element(by.linkText('Install'))
export const namespaceButton = $('.co-namespace-selector button');
export const openshiftNamespaceButton = $('#openshiftCNV');
export const kubevirtOperatorStatus = $('.co-clusterserviceversion-row__status');
export const elmKebab = element(by.xpath("//button[@data-test-id='kebab-button']"))
export const elmUninstall = element(by.xpath("//button[@data-test-action='Uninstall Operator']"))