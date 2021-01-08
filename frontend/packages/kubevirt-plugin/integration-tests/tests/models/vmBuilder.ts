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

  public setCustomize(customize: boolean) {
    this.data.customize = customize;
    return this;
  }

  public setMountAsCDROM(mountAsCDROM: boolean) {
    this.data.mountAsCDROM = mountAsCDROM;
    return this;
  }

  public setPVCSize(pvcSize: string) {
    this.data.pvcSize = pvcSize;
    return this;
  }

  public setPVCName(pvcName: string) {
    this.data.pvcName = pvcName;
    return this;
  }

  public setSelectTemplateName(selectTemplateName: string) {
    this.data.selectTemplateName = selectTemplateName;
    return this;
  }

  build() {
    if (!this.getData().name) {
      super.generateName();
    }
    return new VirtualMachine(this.getData());
  }
}
