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
    this.data.networkMappings = networkMappings;
    return this;
  };

  setStorageMappings = (storageMappings: StorageMapping[]) => {
    this.data.storageMappings = storageMappings;
    return this;
  };

  setDiskMappings = (diskMappings: DiskMapping[]) => {
    this.data.diskMappings = diskMappings;
    return this;
  };
}
