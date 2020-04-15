import {
  DiskMapping,
  NetworkMapping,
  StorageMapping,
  VMImportOvirtSource,
} from '../../../types/vm-import/ovirt/vm-import';
import { Wrapper } from '../common/wrapper';

export class VMImportOvirtSourceWrappper extends Wrapper<
  VMImportOvirtSource,
  VMImportOvirtSourceWrappper
> {
  constructor(
    vmImportOvirtSource?: VMImportOvirtSource | VMImportOvirtSourceWrappper | any,
    copy = false,
  ) {
    super(vmImportOvirtSource, copy);
  }

  setVM = (id: string) => {
    this.ensurePath('vm');
    this.data.vm.id = id;
    return this;
  };

  setNetworkMappings = (networkMappings: NetworkMapping[]) => {
    this.ensurePath('mappings');
    this.data.mappings.networkMappings = networkMappings;
    this.clearIfEmpty('mappings.networkMappings');
    this.clearIfEmpty('mappings');
    return this;
  };

  setStorageMappings = (storageMappings: StorageMapping[]) => {
    this.ensurePath('mappings');
    this.data.mappings.storageMappings = storageMappings;
    this.clearIfEmpty('mappings.storageMappings');
    this.clearIfEmpty('mappings');
    return this;
  };

  setDiskMappings = (diskMappings: DiskMapping[]) => {
    this.ensurePath('mappings');
    this.data.mappings.diskMappings = diskMappings;
    this.clearIfEmpty('mappings.diskMappings');
    this.clearIfEmpty('mappings');
    return this;
  };
}
