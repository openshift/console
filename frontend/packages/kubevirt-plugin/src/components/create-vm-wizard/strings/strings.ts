import { VMWizardTab } from '../types';

export const TabTitleKeyResolver = {
  // t('kubevirt-plugin~Connect to Provider')
  [VMWizardTab.IMPORT_PROVIDERS]: 'kubevirt-plugin~Connect to Provider',
  // t('kubevirt-plugin~General')
  [VMWizardTab.VM_SETTINGS]: 'kubevirt-plugin~General',
  // t('kubevirt-plugin~Networking')
  [VMWizardTab.NETWORKING]: 'kubevirt-plugin~Networking',
  // t('kubevirt-plugin~Storage')
  [VMWizardTab.STORAGE]: 'kubevirt-plugin~Storage',
  // t('kubevirt-plugin~Advanced')
  [VMWizardTab.ADVANCED]: 'kubevirt-plugin~Advanced',
  // t('kubevirt-plugin~Review')
  [VMWizardTab.REVIEW]: 'kubevirt-plugin~Review',
  // t('kubevirt-plugin~Result')
  [VMWizardTab.RESULT]: 'kubevirt-plugin~Result',
};
