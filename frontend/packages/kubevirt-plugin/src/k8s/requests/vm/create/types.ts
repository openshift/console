import { Map as ImmutableMap } from 'immutable';
import { TemplateKind } from '@console/internal/module/k8s';
import {
  ImportProvidersSettings,
  VMSettings,
} from '../../../../components/create-vm-wizard/redux/initial-state/types';
import { SysprepData } from '../../../../components/create-vm-wizard/tabs/advanced-tab/sysprep/utils/sysprep-utils';
import { VMWizardNetwork, VMWizardStorage } from '../../../../components/create-vm-wizard/types';
import { V1GPU, V1HostDevice } from '../../../../types/api';
import { ITemplate } from '../../../../types/template';
import { EnhancedK8sMethods } from '../../../enhancedK8sMethods/enhancedK8sMethods';

export type CreateVMParams = {
  enhancedK8sMethods: EnhancedK8sMethods;
  importProviders: ImportProvidersSettings;
  vmSettings: VMSettings;
  networks: VMWizardNetwork[];
  storages: VMWizardStorage[];
  iUserTemplate: ITemplate;
  iCommonTemplates: ImmutableMap<string, ITemplate>;
  namespace: string;
  openshiftFlag: boolean;
  isProviderImport: boolean;
  isTemplate: boolean;
  sysprepData: SysprepData;
  gpus: V1GPU;
  hostDevices: V1HostDevice;
};

export type DefaultVMLikeEntityParams = {
  commonTemplate: TemplateKind;
  namespace: string;
  name: string;
  baseOSName: string;
  containerImage: string;
};
