import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import {
  asyncForEach,
  deleteResources,
  removeLeakedResources,
} from '@console/shared/src/test-utils/utils';
import { v2vUIDeployment } from '../../tests/mocks/mocks';
import { RhvImportWizard } from '../../tests/models/rhvImportWizard';
import { wrongValues } from '../../tests/utils/constants/vm';
import { rhvVMConfigNoStartOnCreate } from './v2v.rhv.configs';

describe('RHV Wizard validation, negative tests', () => {
  const wizard = new RhvImportWizard();
  const leakedResources = new Set<string>();

  afterAll(async () => {
    removeLeakedResources(leakedResources);
    deleteResources([v2vUIDeployment]);
  });

  beforeEach(async () => {
    await wizard.openWizard(VirtualMachineModel);
  });

  afterEach(async () => {
    await wizard.closeWizard();
  });

  it('RHV - Import Wizard shows warning when using incorrect VM name', async () => {
    await wizard.importVmConnectProviderStep(rhvVMConfigNoStartOnCreate);
    await asyncForEach(wrongValues, async (curValue) => {
      const err = await wizard.fillName(curValue);
      expect(err).toBeDefined();
    });
  });
});
