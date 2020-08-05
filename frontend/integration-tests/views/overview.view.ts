import { $, browser, by, element, ExpectedConditions as until } from 'protractor';

export const projectOverview = $('.odc-topology-list-view');
const projectOverviewItemSelector = '.odc-topology-list-view__item-row';
export const detailsSidebar = $('.overview__sidebar');
export const detailsSidebarTitle = $('.resource-overview__heading .co-m-pane__name');

export const itemsAreVisible = () => {
  return browser.wait(until.presenceOf($(projectOverviewItemSelector)));
};

export const getGroupLabelItem = (kind) => {
  return element(by.cssContainingText('.odc-topology-list-view__kind-label', kind.label));
};

export const getProjectOverviewListItem = (name) => {
  return element(by.cssContainingText('.odc-topology-list-view__label-cell', name));
};

export const sidebarIsLoaded = () => {
  return browser.wait(until.presenceOf($('.resource-overview')));
};

const guidedTourModal = element(by.css('[id="guided-tour-modal"]'));
const guidedTourSkip = element(
  by.cssContainingText('[id="tour-step-footer-secondary"]', 'Skip tour'),
);
const guidedTourClose = element(by.cssContainingText('[id="tour-step-footer-primary"]', 'Close'));

export const closeGuidedTour = async () => {
  if (await guidedTourModal.isPresent()) {
    await browser.wait(until.visibilityOf(guidedTourSkip));
    await guidedTourSkip.click();
    await browser.wait(until.visibilityOf(guidedTourClose));
    await guidedTourClose.click();
  }
};
