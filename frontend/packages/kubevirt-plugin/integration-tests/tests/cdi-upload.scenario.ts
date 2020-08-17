import * as path from 'path';
import { browser, ExpectedConditions as until } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import {
  createItemButton,
  isLoaded,
  saveChangesBtn,
} from '@console/internal-integration-tests/views/crud.view';
import { inputPVCName, inputPVCSize } from '@console/internal-integration-tests/views/storage.view';
import { storageclassDropdown } from '@console/ceph-storage-plugin/integration-tests/views/pvc.view';
import { CDI_UPLOAD_TIMEOUT_SECS } from './utils/constants/common';
import * as cdiUploadView from '../views/cdiUploadView';

// this scenario tests the upload procedure, without creating a vm from the uploaded resource.
// https://issues.redhat.com/browse/CNV-6020

describe('KubeVirt CDI Upload', () => {
  const pvc = { name: 'upload-pvc', size: 100 };

  it(
    'ID(CNV-4718) Upload data to CDI',
    async () => {
      const fileToUpload = './utils/mocks/cdi-upload-file.txt';
      const absolutePath = path.resolve(__dirname, fileToUpload);

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

      await inputPVCName.sendKeys(pvc.name);
      await inputPVCSize.sendKeys(pvc.size);
      await click(cdiUploadView.unitDropdown);
      await click(cdiUploadView.unitMiBButton);
      await click(storageclassDropdown);
      await click(cdiUploadView.firstStorageClass);

      // firefox needs the input to be shown
      await browser.executeAsyncScript((callback) => {
        (document.querySelector('input[type="file"]') as HTMLElement).style.display = 'inline';
        callback();
      });
      await cdiUploadView.uploadInput.sendKeys(absolutePath);
      await click(saveChangesBtn);
      await browser.wait(until.textToBePresentInElement(cdiUploadView.uploadProgress, '100%'));
    },
    CDI_UPLOAD_TIMEOUT_SECS,
  );
});
