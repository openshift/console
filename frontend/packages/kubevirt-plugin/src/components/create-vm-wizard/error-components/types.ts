import { VMWizardTab } from '../types';

export type Action = {
  goToStep?: VMWizardTab;
  openModal?: {
    wizardReduxID: string;
    showInitialValidation?: boolean;
    diskModal?: {
      iStorage: any;
    };
    nicModal?: {
      iNIC: any;
    };
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
