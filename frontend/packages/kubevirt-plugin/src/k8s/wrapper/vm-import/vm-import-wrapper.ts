import { VirtualMachineImportModel } from '../../../models';
import { K8sResourceObjectWithTypePropertyWrapper } from '../common/k8s-resource-object-with-type-property-wrapper';
import { VMImportKind, VMImportOvirtSource } from '../../../types/vm-import/ovirt/vm-import';
import { VMImportType } from '../../../constants/v2v-import/ovirt/vm-import-type';
import { K8sInitAddon } from '../common/util/k8s-mixin';
import { VMImportOvirtSourceWrappper } from './vm-import-ovirt-source-wrapper';

type CombinedTypeData = VMImportOvirtSource; // add other sources once available

export class VMImportWrappper extends K8sResourceObjectWithTypePropertyWrapper<
  VMImportKind,
  VMImportType,
  CombinedTypeData,
  VMImportWrappper
> {
  constructor(vmImport?: VMImportKind | VMImportWrappper | any, copy = false) {
    super(VirtualMachineImportModel, vmImport, copy, VMImportType, ['spec', 'source']);
  }

  init(data: K8sInitAddon = {}) {
    super.init(data);
    this.setStartVM(false);
    return this;
  }

  setTargetVMName = (name: string) => {
    this.ensurePath('spec');
    this.data.spec.targetVmName = name;
    return this;
  };

  setStartVM = (startVM = false) => {
    this.ensurePath('spec');
    this.data.spec.startVM = startVM;
    return this;
  };

  setCredentialsSecret = (secretName: string, secretNamespace: string = undefined) => {
    this.ensurePath('spec.providerCredentialsSecret');
    this.data.spec.providerCredentialsSecret.name = secretName;
    this.data.spec.providerCredentialsSecret.namespace = secretNamespace;
    this.clearIfEmpty('spec.providerCredentialsSecret');
    return this;
  };

  setResourceMapping = (mappingName: string, mappingNamespace: string = undefined) => {
    this.ensurePath('spec.resourceMapping');
    this.data.spec.resourceMapping.name = mappingName;
    this.data.spec.resourceMapping.namespace = mappingNamespace;
    this.clearIfEmpty('spec.resourceMapping');
    return this;
  };

  getOvirtSourceWrapper = () => {
    return this.getType() === VMImportType.OVIRT
      ? new VMImportOvirtSourceWrappper(this.getTypeData(VMImportType.OVIRT))
      : undefined;
  };

  protected sanitize(type: VMImportType, data: VMImportOvirtSource) {
    return super.sanitize(type, data) || ({} as any);
  }
}
