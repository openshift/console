import { $ } from 'protractor';

export const dropdownMenuForTestID = (id: string) => $(`[data-test-dropdown-menu=${id}]`);
