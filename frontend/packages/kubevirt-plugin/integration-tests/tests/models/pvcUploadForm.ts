/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import {
  createItemButton,
  isLoaded,
  saveChangesBtn,
} from '@console/internal-integration-tests/views/crud.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import {
  inputPVCName,
  inputPVCSize,
  selectItemFromDropdown,
  storageclassDropdown,
  selectAccessMode,
  sizeUnitsDropdown,
} from '@console/ceph-storage-plugin/integration-tests/views/pvc.view';
import { click, fillInput } from '@console/shared/src/test-utils/utils';
import { selectOptionByText } from '../utils/utils';
import * as cdiUploadView from '../../views/cdiUploadView';
import { PVCData } from '../types/pvc';

export class UploadForm {
  async openForm() {
    await clickNavLink(['Storage', 'Persistent Volume Claims']);
    await isLoaded();
    await click(createItemButton);
    await click(cdiUploadView.uploadCdiFormButton);

    await browser.wait(
      until.textToBePresentInElement(
        $('.co-m-pane__heading'),
        'Upload Data to Persistent Volume Claim',
      ),
    );
  }

  async fillUploadImage(name: string) {
    // firefox needs the input to be shown
    await browser.executeAsyncScript((callback) => {
      (document.querySelector('input[type="file"]') as HTMLElement).style.display = 'inline';
      callback();
    });
    await cdiUploadView.uploadInput.sendKeys(name);
  }

  async selectGoldenOS(os: string) {
    await click(cdiUploadView.goldenOSCheckbox);
    await selectOptionByText(cdiUploadView.goldenOSDropDownID, os);
  }

  async fillPVCName(pvcName: string) {
    await fillInput(inputPVCName, pvcName);
  }

  async selectStorageClass(sc: string) {
    await selectItemFromDropdown(sc, storageclassDropdown);
  }

  async fillPVCSize(pvcSize: string, pvcSizeUnits: string) {
    await inputPVCSize.sendKeys(pvcSize);
    await selectItemFromDropdown(pvcSizeUnits, sizeUnitsDropdown);
  }

  async selectAccessMode(accessMode: string) {
    await click(selectAccessMode(accessMode));
  }

  async fillAll(data: PVCData) {
    const { image, os, pvcName, pvcSize, pvcSizeUnits, storageClass, accessMode } = data;
    await this.selectStorageClass(storageClass);
    await this.fillPVCSize(pvcSize, pvcSizeUnits);
    if (accessMode) {
      await this.selectAccessMode(accessMode);
    }
    if (os) {
      this.selectGoldenOS(os);
    } else {
      await this.fillPVCName(pvcName);
    }
    await this.fillUploadImage(image);
  }

  async upload(data: PVCData) {
    await this.openForm();
    await this.fillAll(data);
    await click(saveChangesBtn);
  }
}
