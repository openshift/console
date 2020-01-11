import { ConfigMapKind, TemplateKind } from '@console/internal/module/k8s';
import { EnhancedK8sMethods } from '../../../enhancedK8sMethods/enhancedK8sMethods';
import { VMSettings } from '../../../../components/create-vm-wizard/redux/initial-state/types';
import { VMWizardNetwork, VMWizardStorage } from '../../../../components/create-vm-wizard/types';

export type CreateVMParams = {
  enhancedK8sMethods: EnhancedK8sMethods;
  vmSettings: VMSettings;
  networks: VMWizardNetwork[];
  storages: VMWizardStorage[];
  templates: TemplateKind[];
  namespace: string;
  openshiftFlag: boolean;
};

export type CreateVMEnhancedParams = CreateVMParams & {
  storageClassConfigMap: ConfigMapKind;
  isTemplate: boolean;
};
