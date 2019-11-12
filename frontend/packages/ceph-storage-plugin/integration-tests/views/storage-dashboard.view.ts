import { $, $$ } from 'protractor';

export const clusterHealth = $('[class="co-dashboard-text--small co-health-card__text"]');
export const detailsCardStructure = $$('.co-details-card__body dt');
const clusterDetails = $$('.co-details-card__body dd');
export const serviceName = clusterDetails.get(0);
export const clusterName = clusterDetails.get(1);
export const provider = clusterDetails.get(2);
export const ocsVersion = clusterDetails.get(3);
const clusterInventory = $$('[class="co-inventory-card__item-title"]');
export const allNodes = clusterInventory.get(0);
export const allPvcs = clusterInventory.get(1);
export const allPvs = clusterInventory.get(2);
