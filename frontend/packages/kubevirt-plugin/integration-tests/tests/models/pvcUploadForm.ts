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
  sizeUnitsDropdown,
} from '@console/ceph-storage-plugin/integration-tests/views/pvc.view';
import { click, fillInput } from '@console/shared/src/test-utils/utils';
import { selectItemFromDropdown, selectOptionByText } from '../utils/utils';
import * as pvcView from '../../views/pvc.view';
import { PVCData } from '../types/pvc';
import { dropDownItem } from '../../views/uiResource.view';

export class UploadForm {
  async openForm() {
    await clickNavLink(['Storage', 'Persistent Volume Claims']);
    await isLoaded();
    await click(createItemButton);
    await click(pvcView.uploadCdiFormButton);

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
    await pvcView.uploadInput.sendKeys(name);
  }

  async selectGoldenOS(os: string) {
    await click(pvcView.goldenOSCheckbox);
    await selectOptionByText(pvcView.goldenOSDropDownID, os);
  }

  async fillPVCName(pvcName: string) {
    await fillInput(inputPVCName, pvcName);
  }

  async selectStorageClass(sc: string) {
    await selectItemFromDropdown(pvcView.uploadStorageClass, dropDownItem(sc));
  }

  async fillPVCSize(pvcSize: string, pvcSizeUnits: string) {
    await inputPVCSize.sendKeys(pvcSize);
    if (pvcSizeUnits) {
      await selectItemFromDropdown(pvcSizeUnits, sizeUnitsDropdown);
    }
  }

  async selectAccessMode(accessMode: string) {
    await selectItemFromDropdown(pvcView.uploadAccessMode, dropDownItem(accessMode));
  }

  async selectVolumeMode(volumeMode: string) {
    await selectItemFromDropdown(pvcView.uploadVolumeMode, dropDownItem(volumeMode));
  }

  async fillAll(data: PVCData) {
    const {
      image,
      os,
      pvcName,
      pvcSize,
      pvcSizeUnits,
      storageClass,
      accessMode,
      volumeMode,
    } = data;
    await this.selectStorageClass(storageClass);
    await this.fillPVCSize(pvcSize, pvcSizeUnits);
    if (accessMode) {
      await this.selectAccessMode(accessMode);
    }
    if (volumeMode) {
      await this.selectVolumeMode(volumeMode);
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
