import { $ } from 'protractor';

export const clusterHealth = $('[class="co-dashboard-text--small co-health-card__text"]');
export const serviceName = $('[class="co-dashboard-card__body--top-margin co-details-card__body co-dashboard-text--small"]/[class="co-details-card__item-value"][1]')
export const clusterName = $('[class="co-dashboard-card__body--top-margin co-details-card__body co-dashboard-text--small"]/[class="co-details-card__item-value"][2]')
export const provider = $('[class="co-dashboard-card__body--top-margin co-details-card__body co-dashboard-text--small"]/[class="co-details-card__item-value"][3]')
export const ocsVersion = $('[class="co-dashboard-card__body--top-margin co-details-card__body co-dashboard-text--small"]/[class="co-details-card__item-value"][4]')


