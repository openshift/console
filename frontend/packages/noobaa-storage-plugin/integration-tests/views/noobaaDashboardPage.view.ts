import { $ } from 'protractor';

export const noobaaCount = $('div:nth-child(1) > div.co-inventory-card__item-title');
export const obCount = $('div:nth-child(2) > div.co-inventory-card__item-title');
export const obcCount = $('div:nth-child(3) > div.co-inventory-card__item-title');

export const healthLoading = $('.skeleton-health');
export const healthOfMCG = $('div > div > div:nth-child(1) > div > div.co-dashboard-icon > svg');
export const resiliencyOfMCG = $(
  'div > div > div:nth-child(2) > div > div.co-dashboard-icon > svg',
);
export const efficiencyValue = $(
  'div:nth-child(1) > div.nb-object-data-reduction-card__row-status-item > span',
);
export const savingsValue = $(
  'div:nth-child(2) > div.nb-object-data-reduction-card__row-status-item > span',
);

export const resourceProviders = $('.nb-resource-providers-card__row-title');
