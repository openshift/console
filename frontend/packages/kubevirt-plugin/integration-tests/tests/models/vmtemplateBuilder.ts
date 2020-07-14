import { BaseVMBuilder } from './baseVMBuilder';
import { VMTemplateBuilderData } from '../types/vm';
import { TemplateModel } from '../../../../../public/models/index';
import { VirtualMachineTemplate } from './virtualMachineTemplate';

export class VMTemplateBuilder extends BaseVMBuilder<VMTemplateBuilderData> {
  constructor(builder?: VMTemplateBuilder) {
    super(TemplateModel, builder);
  }

  build() {
    if (!this.getData().name) {
      super.generateName();
    }
    return new VirtualMachineTemplate(this.getData());
  }
}
