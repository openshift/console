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

export const unifiedHealthButton = $(
  '.co-status-card__health-body > div > div:nth-child(1) > div > div:nth-child(2) > span > button',
);

export const unifiedDataResiliencyButton = $(
  '.co-status-card__health-body > div > div:nth-child(2) > div > div:nth-child(2) > span > button',
);

export const mcgPopover = $('.co-status-popup__row:nth-child(2) svg');
export const rgwPopover = $('.co-status-popup__row:nth-child(3) svg');

export const POPOVER_GREEN_COLOR = '#3e8635';

export namespace CapacityBreakdown {
  export const viewMoreLink = $('.capacity-breakdown-card__header-link');
  export const serviceTypeDropdown = (linkVisible: boolean) =>
    $(`.nb-capacity-breakdown-card-header__dropdown.pf-c-select:nth-child(${linkVisible ? 2 : 1})`);
  export const breakByDropdown = (linkVisible: boolean) =>
    $(`.nb-capacity-breakdown-card-header__dropdown.pf-c-select:nth-child(${linkVisible ? 3 : 2})`);
  export const serviceTypeItems = {
    ALL: $('.pf-c-select__menu li:nth-child(2) button'),
    MCG: $('.pf-c-select__menu li:nth-child(3) button'),
    RGW: $('.pf-c-select__menu li:nth-child(4) button'),
  };
  export const breakByItems = {
    TOTAL: $('.pf-c-select__menu li:nth-child(2) button'),
    PROJECTS: $('.pf-c-select__menu li:nth-child(3) button'),
    BUCKETS: $('.pf-c-select__menu li:nth-child(4) button'),
  };
}

export namespace PerformanceCard {
  export const serviceTypeDropdown = $(
    '.nb-data-consumption-card__dropdown-item:nth-child(1) > button',
  );
  export const breakByDropdown = $(
    '.nb-data-consumption-card__dropdown-item:nth-child(2) > button',
  );
  export const serviceTypeItems = {
    MCG: $('.pf-c-select__menu li:nth-child(2) button'),
    RGW: $('.pf-c-select__menu li:nth-child(3) button'),
  };
  export const performanceGraph = $('.nb-perf__graph--long');
}
