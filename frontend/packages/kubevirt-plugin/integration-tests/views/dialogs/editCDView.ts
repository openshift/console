import { $ } from 'protractor';

export const cdModalSelectType = '#cd-rom-modal-select-type';
export const cdModalSelectPVC = '#cdrom-pvc-input';
export const cdModalSelectContainer = '#cdrom-container-input';
export const cdModalSelectURL = '#cdrom-url-input';
export const diskSummaryTitle = '#kubevirt-disk-summary-disk-title';

export const cdTypeSelect = (number) => $(`#cd-rom-modal-select-type-cd-drive-${number}`);
export const cdStorageClassSelect = (number) => $(`#cd-url-storageclass-input-cd-drive-${number}`);
export const cdPVCSelect = (number) => $(`#cdrom-pvc-input-cd-drive-${number}`);

export const cdValue = $('#cdrom-value');
export const cdAddBtn = $('#vm-cd-add-btn');
export const cdDeleteBtn = $('.kubevirt-cdrom-modal__delete button');
export const diskSummary = $('.kubevirt-disk-summary');
export const windowsGuestToolsCDElement = $(
  '#kubevirt-disk-summary-disk-title-windows-guest-tools',
);
