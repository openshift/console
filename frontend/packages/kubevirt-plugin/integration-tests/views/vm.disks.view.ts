import { $, $$ } from 'protractor';

export const fileSystemsTableHeader = $('#file-systems-header');
export const fileSystemsTable = $(`[aria-label="FileSystems"]`)
  .$('div')
  .$('table')
  .$('tbody');
export const diskRows = $$('[data-test-rows="resource-row"]');
