import { $, $$ } from 'protractor';

export const vmDetails = $$('.co-details-card__body dd');
export const vmDetailsName = vmDetails.get(0);
export const vmDetailsNamespace = vmDetails.get(1).$('.co-resource-item__resource-name');
export const vmDetailsCreated = vmDetails.get(2);
export const vmDetailsNode = vmDetails.get(3);
export const vmDetailsIPAddress = vmDetails.get(4);

export const vmStatus = $('.co-status-card__health-body > span');

export const vmInventoryItems = $$('.co-inventory-card__item');
export const vmInventoryNICs = vmInventoryItems.get(0);
export const vmInventoryDisks = vmInventoryItems.get(1);
