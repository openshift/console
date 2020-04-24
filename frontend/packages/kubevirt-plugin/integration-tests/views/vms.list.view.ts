import { $, browser, ExpectedConditions as until } from 'protractor';
import { PAGE_LOAD_TIMEOUT_SECS } from '../tests/utils/consts';
import { Status } from '../tests/utils/types';
import { click } from '@console/shared/src/test-utils/utils';
import { last } from 'lodash';

export const virtualizationTitle = $('[data-test-id="cluster-settings-page-heading"]');
export const vmLinkByName = (vmName) => $(`[data-test-id="${vmName}"]`);
export const restrictedAccessBlock = $('.cos-status-box__title');
export const hintBlockTitle = $('.co-hint-block__title.h4');

export const filterToggle = $('[data-test-id="filter-dropdown-toggle"]');

const filterItem = async (status: Status) => {
  const statusElement = $(`#${status}`);
  await browser.wait(until.presenceOf(statusElement));
  return statusElement.getText();
};

export const filterCount = async (status: Status): Promise<number> => {
  try {
    await browser.wait(until.presenceOf(filterToggle), PAGE_LOAD_TIMEOUT_SECS);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Couldn't find filter toggle button.");
    return -1;
  }
  await click(filterToggle);
  const filterText = await filterItem(status);
  const count = last(filterText.split(''));
  await click(filterToggle);
  return Number(count);
};
