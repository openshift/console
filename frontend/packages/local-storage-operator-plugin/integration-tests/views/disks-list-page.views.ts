import { $, $$ } from 'protractor';
import {
  resourceRows,
  textFilter,
  rowFiltersButton,
  isLoaded,
} from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';

export const page = {
  diskTab: $('a[data-test-id="horizontal-link-Disks"]'),
  resourceTitles: $$('[data-test-id="resource-title"]'),
  isLoaded,
};

export const diskList = {
  headerNames: ['Name', 'Disk State', 'Type', 'Model', 'Capacity', 'Filesystem'],
  rows: resourceRows,
  filterDropdown: rowFiltersButton,
  filterDropdownHeader: $('.pf-c-dropdown__group-title'),
  textFilter,
};

export const clickFilterDropdown = () => click(diskList.filterDropdown);

export const clearDiskFilter = async () => {
  const uncheckFilter = await $('.pf-c-chip-group__close >  button');
  await click(uncheckFilter);
};

export const checkDiskFilter = async (filter: string) => {
  await clickFilterDropdown();
  const countBadge = $(`a[data-test-row-filter="${filter}"] > div > .pf-c-badge`);
  const count = await countBadge.getText();
  await click($(`#${filter}`));
  const rowsCount = await resourceRows.count();
  expect(rowsCount).toBe(Number(count));
};
