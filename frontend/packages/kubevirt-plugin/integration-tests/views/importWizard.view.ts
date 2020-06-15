import { $, element, by } from 'protractor';

export const importWithWizardButton = $('#wizardImport-link');

// Basic Import Setting tab
export const providerSelect = $('#provider-dropdown');
export const vcenterInstanceSelect = $('#vcenter-instance-dropdown');
export const vcenterHostnameInput = $('#vcenter-hostname-dropdown');
export const usernameInput = $('#vcenter-username');
export const vcenterPasswordInput = $('#vcenter-password');
export const vcenterSaveInstanceCheckbox = $('#vcenter-remember-credentials');
export const connectInstanceButton = $('#provider-vmware-connect');
export const vmwarePodStatusLoader = $('#v2v-vmware-status-status');
export const virtualMachineSelect = $('#vcenter-vm-dropdown');

export const spinnerIcon = $('svg.fa-spin');
export const connectionWarning = $('h4.pf-c-alert__title');

export const seeDetailPageButton = element(by.buttonText('See virtual machine details'));

export const importButon = element(by.buttonText('Import'));
