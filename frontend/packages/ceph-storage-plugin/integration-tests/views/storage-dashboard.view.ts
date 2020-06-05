import { $, $$, browser } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/shared/src/test-views/dashboard-shared.view';

// export const clusterHealth = $('[class="co-dashboard-text--small co-health-card__text"]');
export const clusterHealth = $('div.co-status-card__health-item div svg');
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

export const goToStorageDashboard = async () => {
  await browser.get(`${appHost}/dashboards/persistent-storage`);
  await isLoaded();
};
