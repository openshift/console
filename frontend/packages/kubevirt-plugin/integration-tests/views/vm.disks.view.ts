import { $ } from 'protractor';

export const fileSystemsTableHeader = $('#file-systems-header');
export const fileSystemsTable = $(`[aria-label="FileSystems"]`)
  .$('div')
  .$('table')
  .$('tbody');
