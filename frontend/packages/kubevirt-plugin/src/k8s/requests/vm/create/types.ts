import { TemplateKind } from '@console/internal/module/k8s';
import { Map as ImmutableMap } from 'immutable';
import { EnhancedK8sMethods } from '../../../enhancedK8sMethods/enhancedK8sMethods';
import {
  ImportProvidersSettings,
  VMSettings,
} from '../../../../components/create-vm-wizard/redux/initial-state/types';
import { VMWizardNetwork, VMWizardStorage } from '../../../../components/create-vm-wizard/types';
import { ITemplate } from '../../../../types/template';

export type CreateVMParams = {
  enhancedK8sMethods: EnhancedK8sMethods;
  importProviders: ImportProvidersSettings;
  vmSettings: VMSettings;
  networks: VMWizardNetwork[];
  storages: VMWizardStorage[];
  iUserTemplates: ImmutableMap<string, ITemplate>;
  iCommonTemplates: ImmutableMap<string, ITemplate>;
  namespace: string;
  openshiftFlag: boolean;
  isProviderImport: boolean;
  isTemplate: boolean;
};

export type DefaultVMLikeEntityParams = {
  commonTemplate: TemplateKind;
  namespace: string;
  name: string;
  baseOSName: string;
  containerImage: string;
};
