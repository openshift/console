import { VMWizardTab } from '../types';

export type Action = {
  goToStep?: VMWizardTab;
  openDiskModal?: {
    wizardReduxID: string;
    iStorage: any;
  };
  openNICModal?: {
    wizardReduxID: string;
    iNIC: any;
  };
};
type Path = {
  id: string;
  name: string;
  action: Action;
};
export type Error = {
  path: Path[];
  id: string;
};
