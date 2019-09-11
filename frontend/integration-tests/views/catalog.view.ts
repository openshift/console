import { $, $$, browser, by, ExpectedConditions as until } from 'protractor';

export const categoryTabs = $$('.vertical-tabs-pf-tab > a');
export const pageHeading = $('.co-catalog-page__heading');
export const pageNumberItemsHeading = $('.co-catalog-page__num-items');
export const pageHeadingNumberOfItems = () => pageNumberItemsHeading.getText()
  .then(text => parseInt(text.substring(0, text.indexOf(' items')), 10));
export const catalogDetailsLoaded = () => browser.wait(until.presenceOf($('.modal-content')), 10000).then(() => browser.sleep(1000));
export const createResourceButton = $('.co-catalog-page__overlay-create');
export const createServiceInstanceForm = $('.co-create-service-instance');
export const createServiceBindingButton = $('.co-well').element(by.buttonText('Create Service Binding'));
export const instantiateTemplateFrom = $('.co-instantiate-template-form');
export const templateInstanceResource = (resourceType: string, resourceName: string) => $(`.co-resource-item>.co-m-resource-icon[title=${resourceType}]+.co-resource-item__resource-name[href*=${resourceName}]`);
export const templateInstanceItem = $('.co-resource-item .co-m-resource-templateinstance');
export const templateInstanceName = $('.co-resource-item__resource-name');
