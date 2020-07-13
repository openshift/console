import { $, element, by } from 'protractor';

// RHV
export const ovirtInstanceSelect = $('#ovirt-engine-dropdown');
export const ovirtApiInput = $('#ovirt-engine-api-url');
export const ovirtCertInput = $('#ovirt-engine-certificate');
export const ovirtUsernameInput = $('#ovirt-engine-username');
export const ovirtPasswordInput = $('#ovirt-engine-password');
export const ovirtClusterSelect = $('#ovirt-cluster-dropdown');
export const ovirtVmSelect = $('#ovirt-vm-dropdown');
export const connectRhvInstanceButton = $('#provider-ovirt-connect');
export const editButton = element(by.buttonText('Edit'));

export const confirmActionButton = $('#confirm-action');
