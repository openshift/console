import { Base64 } from 'js-base64';

import { $, $$, browser, by, element, ExpectedConditions as until } from 'protractor';
import * as crudView from '../views/crud.view';
import { firstElementByTestID } from '../protractor.conf';

export const wait = async (condition) => await browser.wait(condition, 20000);

export const labels = $$('.co-m-label');
export const saveButton = $('button[type=submit]');

// YAML form
export const successAlert = $('.pf-m-success');

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
export const sendResolvedAlerts = firstElementByTestID('send-resolved-alerts');
export const showAdvancedConfiguration = $('button.pf-c-expandable-section__toggle');
export const defaultAlertmanagerYaml = Base64.encode(`"global":
  "resolve_timeout": "5m"
"inhibit_rules":
- "equal":
  - "namespace"
  - "alertname"
  "source_match":
    "severity": "critical"
  "target_match_re":
    "severity": "warning|info"
- "equal":
  - "namespace"
  - "alertname"
  "source_match":
    "severity": "warning"
  "target_match_re":
    "severity": "info"
"receivers":
- "name": "Default"
- "name": "Watchdog"
- "name": "Critical"
"route":
  "group_by":
  - "namespace"
  "group_interval": "5m"
  "group_wait": "30s"
  "receiver": "Default"
  "repeat_interval": "12h"
  "routes":
  - "match":
      "alertname": "Watchdog"
    "receiver": "Watchdog"
  - "match":
      "severity": "critical"
    "receiver": "Critical"`);
