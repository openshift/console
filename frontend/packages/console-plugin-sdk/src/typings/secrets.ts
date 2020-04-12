import { Extension } from './base';
import { K8sResourceCommon, TemplateKind, Patch, K8sKind } from '@console/internal/module/k8s';

namespace ExtensionProperties {
  export interface SecretExtension {
    vmModel: K8sKind;
    getTemplateOfVM: (vm: K8sResourceCommon) => Promise<K8sResourceCommon>;
    getEnvDiskSerial: (vm: K8sResourceCommon, secretName: string) => Promise<string>;
    getVMEnvDiskPatches: (
      vmObj: K8sResourceCommon,
      sourceName: string,
      sourceKind: string,
      serialNumber: string,
      vmTemplate?: TemplateKind,
    ) => Promise<Patch[]>;
  }
}

export interface AddSecretToVMExtension extends Extension<ExtensionProperties.SecretExtension> {
  type: 'Secret/AddSecretToVMExtension';
}

export const isAddSecretToVMExtension = (e: Extension): e is AddSecretToVMExtension =>
  e.type === 'Secret/AddSecretToVMExtension';
