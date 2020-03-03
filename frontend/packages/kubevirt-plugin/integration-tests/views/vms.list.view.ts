import { by, element, $, $$ } from 'protractor';

export const vmListByName = (vmName) => element(by.linkText(vmName));
export const restrictedAccessBlock = $('.cos-status-box__title');
export const hintBlockTitle = $('.co-hint-block__title.h4');

export const filterBoxes = $$('.row-filter__box');

export const filterBox = async (filterBoxName: string) =>
  filterBoxes.filter((elem) => elem.getText().then((text) => text.includes(filterBoxName))).first();

export const filterBoxCount = async (filterBoxName: string): Promise<number> => {
  const box = await filterBox(filterBoxName);
  const count = await box.element(by.css('.row-filter__number-bubble')).getText();
  return Number(count);
};
