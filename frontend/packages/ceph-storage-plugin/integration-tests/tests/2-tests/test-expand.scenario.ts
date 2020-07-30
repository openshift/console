import { execSync } from 'child_process';
import { browser } from 'protractor';
import { clickKebabAction } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  testPVC,
  testRbdPVC,
  testDeployment,
  testDeploymentRbd,
} from '../../mocks/expand-test-mocks';
import {
  goToPersistentVolumeClaims,
  expandButton,
  createNewPersistentVolumeClaim,
  expandSizeOption,
  capacityUnitDropdown,
  inputPVCSize,
} from '../../views/pvc.view';
import { SECOND, SIZE_UNITS } from '../../utils/consts';
import { createObjectFromJson, sendKeys } from '../../utils/helpers';

const expandValue = String(Number(testPVC.size) + 1);

const createDeployment = () =>
  execSync(`echo '${JSON.stringify(testDeployment)}' | kubectl create -f -`);

const expandPVC = async (pvcName: string, value: string, sizeUnit: SIZE_UNITS) => {
  await goToPersistentVolumeClaims();
  await clickKebabAction(pvcName, 'Expand PVC');
  await browser.sleep(2 * SECOND);
  await sendKeys(inputPVCSize, value);
  await click(capacityUnitDropdown);
  await click(expandSizeOption(sizeUnit));
  await click(expandButton);
};

const getPVCRequestedStorage = (pvcName: string) => {
  const pvcJSON = JSON.parse(
    execSync(`kubectl get pvc ${pvcName} -n ${testName} -o json`).toString(),
  );
  return pvcJSON.spec.resources.requests.storage;
};

describe('Tests Expand flow for PVC', () => {
  beforeAll(async () => {
    await createNewPersistentVolumeClaim(testPVC, true, createDeployment);
  });

  it('Test PVC can be expanded (In MiBs)', async () => {
    await expandPVC(testPVC.name, expandValue, SIZE_UNITS.MI);
    await browser.sleep(5 * SECOND);
    const requestedStorage = getPVCRequestedStorage(testPVC.name);
    expect(requestedStorage.trim()).toEqual(`${expandValue}${SIZE_UNITS.MI}`);
  });

  it('Test PVC can be expanded (In GiBs)', async () => {
    await expandPVC(testPVC.name, expandValue, SIZE_UNITS.GI);
    await browser.sleep(5 * SECOND);
    const requestedStorage = getPVCRequestedStorage(testPVC.name);
    expect(requestedStorage.trim()).toEqual(`${expandValue}${SIZE_UNITS.GI}`);
  });

  it('Test PVC can be expanded (In TiBs)', async () => {
    await expandPVC(testPVC.name, '1', SIZE_UNITS.TI);
    await browser.sleep(5 * SECOND);
    const requestedStorage = getPVCRequestedStorage(testPVC.name);
    expect(requestedStorage.trim()).toEqual(`1${SIZE_UNITS.TI}`);
  });

  it('Test RBD PVC can be expanded (In MiBs)', async () => {
    await createNewPersistentVolumeClaim(testRbdPVC, true);
    await createObjectFromJson(testDeploymentRbd);
    await browser.sleep(5 * SECOND);
    await expandPVC(testRbdPVC.name, expandValue, SIZE_UNITS.MI);
    await browser.sleep(5 * SECOND);
    const requestedStorage = getPVCRequestedStorage(testRbdPVC.name);
    expect(requestedStorage.trim()).toEqual(`${expandValue}${SIZE_UNITS.MI}`);
  });
});
