import { VMWizardNetwork, VMWizardStorage } from '../../../components/create-vm-wizard/types';
import { VMKind } from '../../../types/vm';

export type OnVMCreate = (vm: VMKind) => Promise<void>;

export type ImporterResult = {
  networks: VMWizardNetwork[];
  storages: VMWizardStorage[];
  onCreate: OnVMCreate;
};
