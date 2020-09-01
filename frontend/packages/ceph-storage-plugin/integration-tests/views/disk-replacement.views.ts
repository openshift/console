import { $, $$ } from 'protractor';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { Status } from '../../src/components/attached-devices-mode/lso-disk-inventory/state-reducer';

export const page = {
  isLoaded,
  diskTab: $('a[data-test-id="horizontal-link-Disks"]'),
};

export const list = {
  columns: $('th[data-label="OCS Status"]'),
  disabledKebabs: $$('button[data-test-id="kebab-button"]:disabled'),
  kebab: $$('button[data-test-id="kebab-button"]').first(),
};

export const cells = {
  online: $$(`td[data-test-status="ocs-status-${Status.Online}"]`),
  notResponding: $(`td[data-test-status="ocs-status-${Status.NotResponding}"]`),
  replaceReady: $(`td[data-test-status="ocs-status-${Status.ReplacementReady}"]`),
  troubleshootLink: $('a[data-test-id="disk-troubleshoot-link"]'),
  popover: $('.pf-c-popover__body'),
  statusIcon: (cell) => cell.$('span > svg'),
  statusText: (cell) => cell.$('[data-test="status-text"]'),
};

export const modal = {
  title: $('button[data-test-id="kebab-button"]'),
  replaceButton: $('button[data-test-id="kebab-button"]'),
};
