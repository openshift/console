import { $, $$, browser, by, ExpectedConditions as until, element } from 'protractor';
import { addVariableFrom } from '@console/internal-integration-tests/views/environment.view';
import { PAGE_LOAD_TIMEOUT_SECS } from '../tests/utils/consts';

import { click } from '@console/shared/src/test-utils/utils';

export const allPairRows = $$('.pairs-list__row');

export const successAlert = $('.pf-c-alert.pf-m-inline.pf-m-success.co-alert');
export const errorAlert = $('.pf-c-alert.pf-m-inline.pf-m-danger.co-alert.co-alert--scrollable');

export const dropDownBtn = $$('.value-from');
export const textFilter = $('[placeholder="Config Map or Secret"]');
export const option = $$('[role="option"]');
export const deleteButton = $$('.pf-c-button.pf-m-plain.pairs-list__span-btns');

export const serialField = $$('[data-test-id=env-prefix]');
export const saveBtn = element(by.cssContainingText('.pf-m-primary', 'Save'));

export const noSerialError = 'Some sources are missing a Serial Number';
export const dupSerialsError = 'There are two or more sources with the same Serial Number';

export const addVariableButton = element(
  by.buttonText('Add Config Map, Secret or Service Account'),
);

export const addSource = async (sourceName) => {
  await browser.wait(until.elementToBeClickable(addVariableButton), PAGE_LOAD_TIMEOUT_SECS);
  await click(addVariableButton);
  await addVariableFrom(sourceName);
};
