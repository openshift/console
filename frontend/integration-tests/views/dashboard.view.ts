import { $, $$ } from 'protractor';

export const detailsCard = $('[data-test-id="details-card"]');
export const detailsCardList = detailsCard.$('dl');
export const statusCard = $('[data-test-id="status-card"]');
export const inventoryCard = $('[data-test-id="inventory-card"]');
export const utilizationCard = $('[data-test-id="utilization-card"]');
export const utilizationItems = $$('[data-test-id="utilization-item"]');
export const durationDropdown = utilizationCard.$('[data-test-id="duration-select"]');
export const activityCard = $('[data-test-id="activity-card"]');
export const eventsPauseButton = $('[data-test-id="events-pause-button"]');
export const launcherCard = $('[data-test-id="launcher-card"]');
export const resourceQuotasCard = $('[data-test-id="resource-quotas-card"]');
