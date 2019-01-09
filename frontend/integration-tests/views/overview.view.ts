import { $, $$, browser, by, ExpectedConditions as until } from 'protractor';

export const projectOverview = $('.project-overview');
const projectOverviewItemSelector = '.project-overview__item';
export const projectOverviewListItems = $$(projectOverviewItemSelector);
export const detailsSidebar = $('.overview__sidebar');
export const detailsSidebarOverviewTab = detailsSidebar.element(by.buttonText('Overview'));
export const detailsSidebarResourcesTab = detailsSidebar.element(by.buttonText('Resources'));
export const detailsSidebarTitle = $('.resource-overview__heading .co-m-pane__name');

export const itemsAreVisible = () => {
  return browser.wait(until.presenceOf($(projectOverviewItemSelector)));
};

export const getProjectOverviewListItemsOfKind = (kindModel) => {
  return projectOverviewListItems.filter(async(e) => {
    return await e.element(by.className(`co-m-resource-${kindModel.id}`)).isPresent();
  });
};

export const getProjectOverviewListItem = (kindModel, name) => {
  return getProjectOverviewListItemsOfKind(kindModel).filter(async(e) => {
    return await e.element(by.linkText(name)).isPresent();
  });
};

export const sidebarIsLoaded = () => {
  return browser.wait(until.presenceOf($('.resource-overview')));
};
