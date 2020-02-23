import { $, element, by, $$ } from 'protractor';

export const objectServiceLink = element(by.cssContainingText('a', 'Object Service'));
export const overviewLink = element(by.cssContainingText('a', 'Overview'));
export const noobaaExternalLink = element(by.cssContainingText('a.co-external-link', 'noobaa'));
export const noobaaAddStorageResource = $$('button.btn.overview-btn').get(0);
export const noobaaAddStorageResourceModal = $(
  '.modal.column.text-left.pop-centered.card-shadow.modal-small.add-resources-modal',
);
