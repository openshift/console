import { execSync } from 'child_process';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { browser, ExpectedConditions as until } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';
import { errorMessage, saveChangesBtn } from '@console/internal-integration-tests/views/crud.view';
import { pvcStatus } from '@console/ceph-storage-plugin/integration-tests/views/pvc.view';
import { PVC_STATUS } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import { CDI_UPLOAD_TIMEOUT_SECS, STORAGE_CLASS } from './utils/constants/common';
import { OperatingSystem } from './utils/constants/wizard';
import * as cdiUploadView from '../views/cdiUploadView';
import { PVCData } from './types/pvc';
import { UploadForm } from './models/pvcUploadForm';

// this scenario tests the upload procedure, without creating a vm from the uploaded resource.
// https://issues.redhat.com/browse/CNV-6020

describe('KubeVirt CDI Upload', () => {
  const uploadForm = new UploadForm();
  const srcImage =
    'http://cnv-qe-server.rhevdev.lab.eng.rdu2.redhat.com/files/cnv-tests/cirros-images/cirros-0.4.0-x86_64-disk.qcow2';
  const desImage = '/tmp/cirros.qcow2';
  const invalidImage = '/tmp/cirros.txt';
  const pvcName = `upload-pvc-${testName}`;

  beforeAll(async () => {
    execSync(`curl ${srcImage} -o ${desImage}`);
    execSync(`ln -s -f ${desImage} ${invalidImage}`);
  });

  afterAll(async () => {
    execSync(`rm ${desImage} ${invalidImage}`);
    execSync(`kubectl delete -n ${testName} dv ${pvcName}`);
  });

  it(
    'ID(CNV-4718) Upload data to CDI',
    async () => {
      const pvc: PVCData = {
        image: desImage,
        pvcName: `upload-pvc-${testName}`,
        pvcSize: '1',
        pvcSizeUnits: 'Gi',
        storageClass: STORAGE_CLASS,
      };

      await uploadForm.upload(pvc);

      await browser.wait(until.textToBePresentInElement(cdiUploadView.uploadProgress, '100%'));
      await click(cdiUploadView.viewStatusID);
      await browser.wait(until.textToBePresentInElement(pvcStatus, PVC_STATUS.BOUND));
    },
    CDI_UPLOAD_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4891) It shows error messsages when image format is not supported',
    async () => {
      const pvc: PVCData = {
        image: invalidImage,
        pvcName: `upload-pvc-${testName}-invalid`,
        pvcSize: '1',
        pvcSizeUnits: 'Gi',
        storageClass: STORAGE_CLASS,
      };

      await uploadForm.upload(pvc);
      await browser.wait(until.presenceOf(errorMessage));
      expect(errorMessage.getText()).toContain('not supported');
    },
    CDI_UPLOAD_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-4890) Upload image for golden OS',
    async () => {
      const pvc: PVCData = {
        image: desImage,
        os: OperatingSystem.RHEL7,
        pvcSize: '1',
        pvcSizeUnits: 'Gi',
        storageClass: STORAGE_CLASS,
      };

      await uploadForm.upload(pvc);
      // It has to click the upload button again to trigger uploading based on actual test results.
      await click(saveChangesBtn);
      await browser.wait(until.textToBePresentInElement(cdiUploadView.uploadProgress, '100%'));
      await click(cdiUploadView.viewStatusID);
      await browser.wait(until.textToBePresentInElement(pvcStatus, PVC_STATUS.BOUND));
    },
    CDI_UPLOAD_TIMEOUT_SECS,
  );
});
