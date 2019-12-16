import { element, by, browser, $$, $ } from 'protractor';
import { waitForNone } from '../protractor.conf';

export const heading = element(
  by.cssContainingText('[data-test-id="cluster-settings-page-heading"]', 'Cluster Settings'),
);
export const isLoaded = async () => await browser.wait(waitForNone($$('.co-m-loader')));
export const channelUpdateLink = $('[data-test-id="current-channel-update-link"]');
export const channelDropdownButton = $('[data-test-id="dropdown-button"]');
export const getSelectedChannel = $$('.pf-c-dropdown__menu-item');
export const channelPopupCancelButton = $('[data-test-id="modal-cancel-action"]');
export const globalConfigResourceRow = $('[data-test-action="Console"]').$$(
  '[data-test-id="kebab-button"]',
);
export const clusterOperatorResourceLink = $('[data-test-id="console"]');
export const globalConfigResourceLink = $('[data-test-id="Console"]');
export const clusterResourceDetailsTitle = $('[data-test-id="resource-title"]');
export const globalConfigDetailsTitle = $('[data-test-id="api-explorer-resource-title"]');
