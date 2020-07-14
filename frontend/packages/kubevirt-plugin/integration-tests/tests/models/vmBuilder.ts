import { BaseVMBuilder } from './baseVMBuilder';
import { VMBuilderData } from '../types/vm';
import { VirtualMachineModel } from '../../../src/models/index';
import { VirtualMachine } from './virtualMachine';

export class VMBuilder extends BaseVMBuilder<VMBuilderData> {
  constructor(builder?: VMBuilder) {
    super(VirtualMachineModel, builder);
  }

  public setStartOnCreation(startOnCreation: boolean) {
    this.data.startOnCreation = startOnCreation;
    return this;
  }

  public setWaitForImport(waitForDiskImport: boolean) {
    this.data.waitForDiskImport = waitForDiskImport;
    return this;
  }

  build() {
    if (!this.getData().name) {
      super.generateName();
    }
    return new VirtualMachine(this.getData());
  }
}
