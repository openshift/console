import { $, $$, browser } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/shared/src/test-views/dashboard-shared.view';

export const msgStatus = $('div.co-status-card__health-item div svg');
const bucketsCard = $$('div.nb-buckets-card__buckets-status-title');
export const noobaaBuckets = bucketsCard.get(0);
export const obs = bucketsCard.get(1);
export const obcs = bucketsCard.get(2);

export const goToObjectServiceDashboard = async () => {
  await browser.get(`${appHost}/dashboards/object-service`);
  await isLoaded();
};
