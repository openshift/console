import { $, $$, browser, by, ExpectedConditions as until } from 'protractor';

import * as crudView from '../views/crud.view';

export const wait = async(condition) => await browser.wait(condition, 15000);

// List pages
export const listPageHeading = $('.co-m-pane__heading');
export const firstListLink = $$('.co-resource-list__item a.co-resource-link__resource-name').first();
export const createButton = $('.co-m-pane__filter-bar-group button');
export const rowMenuButton = row => row.$('.co-kebab__button');

// Details pages
export const detailsHeading = $('.co-m-nav-title .co-m-pane__name');
export const detailsSubHeadings = $$('.co-m-pane__body h2');
export const labels = $$('.co-m-label');
export const expiredSilenceIcon = $('.co-m-pane__details .fa-ban');
export const ruleLink = $('.co-m-pane__details .co-resource-link__resource-name');
export const silenceComment = $$('.co-m-pane__details dd').get(-2);
export const firstAlertsListLink = $$('.co-resource-list__item a.co-resource-link').first();

export const clickActionsMenuAction = async(actionText) => {
  await wait(until.presenceOf(crudView.actionsDropdown));
  await crudView.actionsDropdown.click();
  await wait(until.presenceOf(crudView.actionsDropdownMenu));
  await crudView.actionsDropdownMenu.element(by.linkText(actionText)).click();
};

// Silence form
export const matcherNameInput = $('input[placeholder=Name]');
export const matcherValueInput = $('input[placeholder=Value]');
export const commentTextarea = $('textarea');
export const saveButton = $('button[type=submit]');

// Modal
export const modalConfirmButton = $('#confirm-action');
