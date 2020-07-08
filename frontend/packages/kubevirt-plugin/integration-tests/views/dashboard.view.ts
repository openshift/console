import { $, $$ } from 'protractor';

export const vmDetails = $$('.co-details-card__body dd');
export const vmDetailsName = vmDetails.get(0);
export const vmDetailsNamespace = vmDetails.get(1).$('.co-resource-item__resource-name');
export const vmDetailsCreated = vmDetails.get(2);
export const vmDetailsHostname = vmDetails.get(3);
export const vmDetailsNode = vmDetails.get(4);
export const vmDetailsIPAddress = vmDetails.get(5);
export const vmDetailsOS = vmDetails.get(6);
export const vmDetailsTZ = vmDetails.get(7);
export const vmDetailsLoggedUser = vmDetails.get(8);

export const vmStatus = $('.co-status-card__health-body > span');
export const vmStatusAlert = $('.co-status-card__alert-item');

export const vmInventoryItems = $$('.co-inventory-card__item');
export const vmInventoryNICs = vmInventoryItems.get(0);
export const vmInventoryDisks = vmInventoryItems.get(1);
