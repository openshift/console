import { execSync } from 'child_process';
import { clickKebabAction } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { testPVC, testDeployment } from '../../mocks/expand-test-mocks';
import { requestSizeValueInput } from '../../views/add-capacity.view';
import {
  goToPersistentVolumeClaims,
  expandButton,
  createNewPersistentVolumeClaim,
  expandSizeOption,
  capacityUnitDropdown,
} from '../../views/pvc.view';
import { SIZE_UNITS } from '../../utils/consts';
import { sendKeys } from '../../utils/helpers';

const expandValue = String(Number(testPVC.size) + 1);

const createDeployment = () =>
  execSync(`echo '${JSON.stringify(testDeployment)}' | kubectl create -f -`);

const expandPVC = async (value: string, sizeUnit: SIZE_UNITS) => {
  await clickKebabAction(testPVC.name, 'Expand PVC');
  sendKeys(requestSizeValueInput, value);
  await click(capacityUnitDropdown);
  await click(expandSizeOption(sizeUnit));
  await click(expandButton);
};

const getPVCRequestedStorage = () => {
  const pvcJSON = JSON.parse(
    execSync(`kubectl get pvc ${testPVC.name} -n ${testName} -o json`).toString(),
  );
  return pvcJSON.spec.resources.requests.storage;
};

describe('Tests Expand flow for PVC', () => {
  beforeAll(async () => {
    await createNewPersistentVolumeClaim(testPVC, true, createDeployment);
  });

  beforeEach(async () => {
    await goToPersistentVolumeClaims();
  });

  it('Test PVC can be expanded (In MiBs)', async () => {
    await expandPVC(expandValue, SIZE_UNITS.MI);
    const requestedStorage = getPVCRequestedStorage();
    expect(requestedStorage.trim()).toEqual(`${expandValue}${SIZE_UNITS.MI}`);
  });

  it('Test PVC can be expanded (In GiBs)', async () => {
    await expandPVC(expandValue, SIZE_UNITS.GI);
    const requestedStorage = getPVCRequestedStorage();
    expect(requestedStorage.trim()).toEqual(`${expandValue}${SIZE_UNITS.GI}`);
  });

  it('Test PVC can be expanded (In TiBs)', async () => {
    await expandPVC('1', SIZE_UNITS.TI);
    const requestedStorage = getPVCRequestedStorage();
    expect(requestedStorage.trim()).toEqual(`1${SIZE_UNITS.TI}`);
  });
});
