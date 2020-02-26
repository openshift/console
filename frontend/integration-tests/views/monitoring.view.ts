import { Base64 } from 'js-base64';

import { $, $$, browser, by, element, ExpectedConditions as until } from 'protractor';
import * as crudView from '../views/crud.view';
import { firstElementByTestID } from '../protractor.conf';

export const wait = async (condition) => await browser.wait(condition, 20000);

// List pages
export const listPageHeading = $('.co-m-pane__heading');
export const createButton = $('.co-m-pane__filter-bar-group button');

// Details pages
export const detailsHeading = $('.co-m-nav-title .co-resource-item');
export const detailsHeadingAlertIcon = $('.co-m-nav-title .co-m-resource-alert');
export const detailsHeadingRuleIcon = $('.co-m-nav-title .co-m-resource-alertrule');
export const detailsHeadingSilenceIcon = $('.co-m-nav-title .co-m-resource-silence');
export const detailsSubHeadings = $$('.co-m-pane__body h2');
export const labels = $$('.co-m-label');
export const expiredSilenceIcon = $('.co-m-pane__details [data-test-id="ban-icon"]');
export const ruleLink = $('.co-m-pane__details .co-resource-item__resource-name');
export const silenceComment = $$('.co-m-pane__details dd').get(-2);
export const firstAlertsListLink = $$('.co-resource-list__item a.co-resource-item').first();

// Silence form
export const matcherNameInput = $('input[placeholder=Name]');
export const matcherValueInput = $('input[placeholder=Value]');
export const commentTextarea = $('textarea');
export const saveButton = $('button[type=submit]');

// Modal
export const modalConfirmButton = $('#confirm-action');

// YAML form
export const successAlert = $('.pf-m-success');
export const helpText = $('.co-help-text');

// Configuration Overview
export const alertRoutingHeader = $('[data-test-section-heading="Alert Routing"]');
export const alertRoutingEditButton = $('.co-alert-manager-config__edit-alert-routing-btn');
export const disabledDeleteReceiverMenuItem = $(
  '.pf-c-dropdown__menu-item.pf-m-disabled[data-test-action="Delete Receiver"]',
);

const firstRow = element.all(by.css(`[data-test-rows="resource-row"]`)).first();

export const openFirstRowKebabMenu = () => {
  return firstRow
    .$('[data-test-id="kebab-button"]')
    .click()
    .then(() => browser.wait(until.visibilityOf($('[data-test-id="action-items"]'))));
};

export const clickFirstRowKebabAction = (actionLabel: string) => {
  return firstRow
    .$('[data-test-id="kebab-button"]')
    .click()
    .then(() => browser.wait(until.elementToBeClickable(crudView.actionForLabel(actionLabel))))
    .then(() => crudView.actionForLabel(actionLabel).click());
};

export const getFirstRowAsText = () => {
  return firstRow.getText().then((text) => {
    return text.replace(/[\n\r]/g, ' ');
  });
};

export const saveAsDefault = firstElementByTestID('save-as-default');

export const defaultAlertmanagerYaml = Base64.encode(`"global":
  "resolve_timeout": "5m"
"receivers":
- "name": "null"
"route":
  "group_by":
  - "job"
  "group_interval": "5m"
  "group_wait": "30s"
  "receiver": "null"
  "repeat_interval": "12h"
  "routes":
  - "match":
      "alertname": "Watchdog"
    "receiver": "null"`);
