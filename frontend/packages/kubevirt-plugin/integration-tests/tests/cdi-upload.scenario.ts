/* eslint-disable no-await-in-loop */
import { execSync } from 'child_process';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { browser, ExpectedConditions as until } from 'protractor';
import {
  removeLeakedResources,
  withResource,
  withResources,
} from '@console/shared/src/test-utils/utils';
import { errorMessage } from '@console/internal-integration-tests/views/crud.view';
import {
  CLONE_VM_TIMEOUT_SECS,
  CDI_UPLOAD_TIMEOUT_SECS,
  VM_BOOTUP_TIMEOUT_SECS,
  STORAGE_CLASS,
  CIRROS_IMAGE,
  FEDORA_IMAGE,
  RHEL7_IMAGE,
  WIN10_IMAGE,
} from './utils/constants/common';
import { VM_STATUS } from './utils/constants/vm';
import {
  CIRROS_PVC,
  LOCAL_CIRROS_IMAGE,
  FEDORA_PVC,
  RHEL7_PVC,
  WIN10_PVC,
} from './utils/constants/pvc';
import { PVCData } from './types/pvc';
import { UploadForm } from './models/pvcUploadForm';
import { PVC } from './models/pvc';
import { VMBuilder } from './models/vmBuilder';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { flavorConfigs } from './mocks/mocks';

function imagePull(src, dest) {
  if (src === CIRROS_IMAGE) {
    execSync(`ln -s -f ${LOCAL_CIRROS_IMAGE} ${dest}`);
  } else {
    execSync(`test -f ${dest} || curl --fail ${src} -o ${dest}`);
  }
}

describe('KubeVirt Auto Clone', () => {
  const leakedResources = new Set<string>();
  const cirrosPVC = new PVC(CIRROS_PVC);
  const rhel7PVC = new PVC(RHEL7_PVC);
  const invalidImage = '/tmp/cirros.txt';
  const imageFormats = ['/tmp/cirros.iso', '/tmp/cirros.img', '/tmp/cirros.gz', '/tmp/cirros.xz'];

  beforeAll(async () => {
    execSync(`test -f ${cirrosPVC.image} || curl --fail ${CIRROS_IMAGE} -o ${cirrosPVC.image}`);
    execSync(`ln -s -f ${cirrosPVC.image} ${invalidImage}`);
    imageFormats.forEach((image) => {
      execSync(`ln -s -f ${cirrosPVC.image} ${image}`);
    });
    imageFormats.push(LOCAL_CIRROS_IMAGE);
    imagePull(RHEL7_IMAGE, rhel7PVC.image);
  });

  afterAll(async () => {
    execSync(`rm ${rhel7PVC.image} ${invalidImage}`);
    imageFormats.forEach((image) => {
      execSync(`rm ${image}`);
    });
    removeLeakedResources(leakedResources);
  });

  describe('KubeVirt CDI Upload', () => {
    const uploadForm = new UploadForm();

    it(
      'ID(CNV-4778) Images with supported format can be uploaded',
      async () => {
        for (const img of imageFormats) {
          CIRROS_PVC.pvcName = `pvc-image-with-suffix-${img.split('.').pop()}`;
          CIRROS_PVC.image = img;
          const pvc = new PVC(CIRROS_PVC);
          await withResource(leakedResources, pvc.getDVResource(), async () => {
            await pvc.create();
          });
        }
      },
      4 * CDI_UPLOAD_TIMEOUT_SECS,
    );

    it('ID(CNV-4891) It shows an error when image format is not supported', async () => {
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
    });

    it(
      'ID(CNV-5038) Upload data to golden OS template again after delete',
      async () => {
        await withResource(leakedResources, rhel7PVC.getDVResource(), async () => {
          await rhel7PVC.create();
        });
        // it can be associated again.
        await withResource(leakedResources, rhel7PVC.getDVResource(), async () => {
          await rhel7PVC.create();
        });
      },
      2 * CDI_UPLOAD_TIMEOUT_SECS,
    );

    it('ID(CNV-5176) It shows an error when uploading data to golden OS again', async () => {
      await withResource(leakedResources, rhel7PVC.getDVResource(), async () => {
        await rhel7PVC.create();
        await uploadForm.openForm();
        await uploadForm.selectGoldenOS(rhel7PVC.os);
        await browser.wait(until.presenceOf(errorMessage));
        expect(errorMessage.getText()).toContain('Operating system source already defined');
      });
    });
  });

  describe('KubeVirt GOLDEN OS Creation', () => {
    const fedoraPVC = new PVC(FEDORA_PVC);
    const win10PVC = new PVC(WIN10_PVC);

    beforeAll(async () => {
      imagePull(FEDORA_IMAGE, fedoraPVC.image);
      imagePull(WIN10_IMAGE, win10PVC.image);
    });

    afterAll(async () => {
      execSync(`rm ${FEDORA_PVC.image} ${WIN10_PVC.image}`);
    });

    it(
      'ID(CNV-5042) Create multiple VMs from the same golden os template',
      async () => {
        const vm1 = new VMBuilder(getBasicVMBuilder())
          .setOS(rhel7PVC.os)
          .generateNameForPrefix('auto-clone-vm1')
          .setStartOnCreation(true)
          .build();

        const vm2 = new VMBuilder(getBasicVMBuilder())
          .setOS(rhel7PVC.os)
          .generateNameForPrefix('auto-clone-vm2')
          .setStartOnCreation(true)
          .build();

        await withResources(
          leakedResources,
          [vm1.asResource(), vm2.asResource(), rhel7PVC.getDVResource()],
          async () => {
            await rhel7PVC.create();
            await vm1.create();
            await vm1.navigateToDetail();
            await vm2.create();
            await vm2.navigateToDetail();
          },
        );
      },
      VM_BOOTUP_TIMEOUT_SECS + CLONE_VM_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-5041) VM can be up after deleting backend golden PVC',
      async () => {
        const fedora = new VMBuilder(getBasicVMBuilder())
          .setOS(fedoraPVC.os)
          .generateNameForPrefix('auto-clone-vm-with-pvc-deleted')
          .setStartOnCreation(false)
          .build();

        await withResources(
          leakedResources,
          [fedora.asResource(), fedoraPVC.getDVResource()],
          async () => {
            await fedoraPVC.create();
            await fedora.create();
            await fedora.waitForStatus(VM_STATUS.Off);
            await fedoraPVC.delete();
            await fedora.start();
            await fedora.navigateToDetail();
          },
        );
      },
      VM_BOOTUP_TIMEOUT_SECS + CLONE_VM_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-5043) Create Fedora/RHEL/Windows VMs from golden os template',
      async () => {
        // skip creating fedora/rhel vm here as it's covered above.
        const win10 = new VMBuilder(getBasicVMBuilder())
          .setOS(win10PVC.os)
          .setFlavor(flavorConfigs.Medium)
          .generateNameForPrefix('auto-clone-win10-vm')
          .setStartOnCreation(true)
          .build();

        await withResources(
          leakedResources,
          [win10.asResource(), win10PVC.getDVResource()],
          async () => {
            await win10PVC.create();
            await win10.create();
            await win10.navigateToDetail();
          },
        );
      },
      VM_BOOTUP_TIMEOUT_SECS + CLONE_VM_TIMEOUT_SECS,
    );
  });
});
