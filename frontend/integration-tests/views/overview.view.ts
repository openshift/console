import { $, $$, browser, by, element, ExpectedConditions as until } from 'protractor';

export const projectOverview = $('.project-overview');
const projectOverviewItemSelector = '.project-overview__item';
export const projectOverviewListItems = $$(projectOverviewItemSelector);
export const detailsSidebar = $('.overview__sidebar');
export const detailsSidebarOverviewTab = detailsSidebar.element(by.buttonText('Overview'));
export const detailsSidebarResourcesTab = detailsSidebar.element(by.buttonText('Resources'));
export const detailsSidebarTitle = $('.resource-overview__heading .co-m-pane__name');

export const itemsAreVisible = async() => {
  return await browser.wait(until.presenceOf($(projectOverviewItemSelector)));
};

export const getProjectOverviewListItemsOfKind = (kindModel) => {
  return $$(`.project-overview__item--${kindModel.kind}`);
};

export const getProjectOverviewListItem = (kindModel, name) => {
  return element(by.cssContainingText(`.project-overview__item--${kindModel.kind}`, name));
};

export const sidebarIsLoaded = () => {
  return browser.wait(until.presenceOf($('.resource-overview')));
};
