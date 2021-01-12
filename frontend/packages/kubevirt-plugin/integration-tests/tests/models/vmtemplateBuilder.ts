import { BaseVMBuilder } from './baseVMBuilder';
import { VMTemplateBuilderData } from '../types/vm';
import { TemplateModel } from '../../../../../public/models/index';
import { VirtualMachineTemplate } from './virtualMachineTemplate';

export class VMTemplateBuilder extends BaseVMBuilder<VMTemplateBuilderData> {
  constructor(builder?: VMTemplateBuilder) {
    super(TemplateModel, builder);
  }

  setProvider(provider: string) {
    this.data.provider = provider;
    return this;
  }

  build() {
    if (!this.getData().name) {
      super.generateName();
    }
    return new VirtualMachineTemplate(this.getData());
  }
}
