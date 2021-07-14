/* eslint-disable no-await-in-loop */
import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { errorMessage, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import {
  click,
  createResource,
  removeLeakedResources,
  withResource,
  withResources,
} from '../utils/shared-utils';
import { typeWarnMessage } from '../views/pvc.view';
import { bootSource, vmtLinkByName } from '../views/template.view';
import { AccessMode, getTestDataVolume, VolumeMode } from './mocks/mocks';
import { getBasicVMBuilder, getBasicVMTBuilder } from './mocks/vmBuilderPresets';
import { PVC } from './models/pvc';
import { UploadForm } from './models/pvcUploadForm';
import { VMBuilder } from './models/vmBuilder';
import { VMTemplateBuilder } from './models/vmtemplateBuilder';
import { PVCData } from './types/pvc';
import {
  CDI_UPLOAD_TIMEOUT_SECS,
  CIRROS_IMAGE,
  CLONE_VM_TIMEOUT_SECS,
  FEDORA_IMAGE,
  PAGE_LOAD_TIMEOUT_SECS,
  RHEL7_IMAGE,
  STORAGE_CLASS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
  WIN10_IMAGE,
} from './utils/constants/common';
import {
  CIRROS_PVC,
  FEDORA_PVC,
  GOLDEN_OS_IMAGES_NS,
  LOCAL_CIRROS_IMAGE,
  RHEL7_PVC,
  WIN10_PVC,
} from './utils/constants/pvc';
import { VM_STATUS } from './utils/constants/vm';
import { Flavor, TemplateByName } from './utils/constants/wizard';
import { uploadOSImage } from './utils/utils';

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

    it('ID(CNV-4778) NO warning message shows image is supported', async () => {
      for (const img of imageFormats) {
        CIRROS_PVC.pvcName = `pvc-image-with-suffix-${img.split('.').pop()}`;
        CIRROS_PVC.image = img;
        await uploadForm.openForm();
        await uploadForm.fillAll(CIRROS_PVC);
        await browser.wait(until.stalenessOf(typeWarnMessage));
      }
    });

    it('ID(CNV-4891) It shows a warning message when image format is not supported', async () => {
      const pvc: PVCData = {
        image: invalidImage,
        pvcName: `upload-pvc-${testName}-invalid`,
        pvcSize: '1',
        storageClass: STORAGE_CLASS,
      };

      await uploadForm.openForm();
      await uploadForm.fillAll(pvc);
      await browser.wait(until.presenceOf(typeWarnMessage));
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

    it(
      'ID(CNV-5176) It shows an error when uploading data to golden OS again',
      async () => {
        await withResource(leakedResources, rhel7PVC.getDVResource(), async () => {
          await rhel7PVC.create();
          await uploadForm.openForm();
          await uploadForm.selectGoldenOS(rhel7PVC.os);
          await browser.wait(until.presenceOf(errorMessage));
          const alertText = await errorMessage.getText();
          expect(alertText).toContain('Operating system source already defined');
        });
      },
      CDI_UPLOAD_TIMEOUT_SECS,
    );
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

    it('ID(CNV-5042) Create multiple VMs from the same golden os template', async () => {
      const vm1 = new VMBuilder(getBasicVMBuilder())
        .setSelectTemplateName(TemplateByName.RHEL7)
        .generateNameForPrefix('auto-clone-vm1')
        .setStartOnCreation(false)
        .build();

      const vm2 = new VMBuilder(getBasicVMBuilder())
        .setSelectTemplateName(TemplateByName.RHEL7)
        .generateNameForPrefix('auto-clone-vm2')
        .build();

      await withResources(
        leakedResources,
        [vm1.asResource(), vm2.asResource(), rhel7PVC.getDVResource()],
        async () => {
          await rhel7PVC.create();
          await vm1.create();
          await vm2.create();
          await vm1.start();
        },
      );
    }, 1200000);

    it('ID(CNV-5041) VM can be up after deleting backend golden PVC', async () => {
      const fedora = new VMBuilder(getBasicVMBuilder())
        .setSelectTemplateName(TemplateByName.FEDORA)
        .generateNameForPrefix('auto-clone-vm-with-pvc-deleted')
        .setStartOnCreation(false)
        .build();

      await withResources(
        leakedResources,
        [fedora.asResource(), fedoraPVC.getDVResource()],
        async () => {
          await fedoraPVC.create();
          await fedora.create();
          await fedora.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
          // only delete template pvc for ocs, hpp does not support this
          if (STORAGE_CLASS === 'ocs-storagecluster-ceph-rbd') {
            await fedoraPVC.delete();
          }
          await fedora.start();
          await fedora.navigateToDetail();
        },
      );
    }, 1200000);

    it('ID(CNV-5043) Create Fedora/RHEL/Windows VMs from golden os template', async () => {
      // skip creating fedora/rhel vm here as it's covered above.
      const win10 = new VMBuilder(getBasicVMBuilder())
        .setFlavor({ flavor: Flavor.MEDIUM }) // Win does not have tiny flavor
        .setSelectTemplateName(TemplateByName.WINDOWS_10)
        .generateNameForPrefix('auto-clone-win10-vm')
        .setStartOnCreation(false)
        .build();

      await withResources(
        leakedResources,
        [win10.asResource(), win10PVC.getDVResource()],
        async () => {
          await win10PVC.create();
          await win10.create();
          await win10.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
          await win10.start();
          await win10.navigateToDetail();
        },
      );
    }, 1200000);
  });

  describe('Auto-clone from cli', () => {
    const vmTemplate = new VMTemplateBuilder(getBasicVMTBuilder())
      .setName(TemplateByName.RHEL8)
      .build();
    let volumeMode;
    if (VolumeMode === 'Filesystem') {
      volumeMode = false;
    }
    if (VolumeMode === 'Block') {
      volumeMode = true;
    }

    beforeAll(async () => {
      if (STORAGE_CLASS === 'ocs-storagecluster-ceph-rbd') {
        uploadOSImage('rhel8', GOLDEN_OS_IMAGES_NS, cirrosPVC.image, AccessMode, volumeMode);
      }
      if (STORAGE_CLASS === 'hostpath-provisioner') {
        const testDV = getTestDataVolume('rhel8', GOLDEN_OS_IMAGES_NS);
        createResource(testDV);
      }
    });

    afterAll(async () => {
      execSync(`kubectl delete dv rhel8 --ignore-not-found -n ${GOLDEN_OS_IMAGES_NS}`);
    });

    it(
      'ID(CNV-5044) Verify boot source available for the template RHEL8',
      async () => {
        await vmTemplate.navigateToListView();
        await click(vmtLinkByName(vmTemplate.name));
        await isLoaded();
        await browser.wait(until.presenceOf(bootSource), PAGE_LOAD_TIMEOUT_SECS);
        await browser.wait(until.textToBePresentInElement(bootSource, 'Available'));
      },
      PAGE_LOAD_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-5597) Create RHEL8 VM from golden os template upload via CLI',
      async () => {
        const rhel8 = new VMBuilder(getBasicVMBuilder())
          .setSelectTemplateName(TemplateByName.RHEL8)
          .setStartOnCreation(true)
          .build();

        await withResource(leakedResources, rhel8.asResource(), async () => {
          await rhel8.create();
          await rhel8.navigateToDetail();
        });
      },
      VM_BOOTUP_TIMEOUT_SECS + CLONE_VM_TIMEOUT_SECS,
    );

    it(
      'ID(CNV-5598) Delete RHEL8 DV from CLI',
      async () => {
        execSync(`kubectl delete dv rhel8 -n ${GOLDEN_OS_IMAGES_NS}`);

        await vmTemplate.navigateToListView();
        await click(vmtLinkByName(vmTemplate.name));
        await isLoaded();
        await browser.wait(until.stalenessOf(bootSource), PAGE_LOAD_TIMEOUT_SECS);
      },
      PAGE_LOAD_TIMEOUT_SECS,
    );
  });
});
