/* eslint-disable lines-between-class-members */
import { ObjectEnum } from './object-enum';

export class StatusGroup extends ObjectEnum<string> {
  static readonly VMIMPORT = new StatusGroup('VMIMPORT', 'VM Import');
  static readonly CDI = new StatusGroup('CDI', 'CDI');
  static readonly VMWARE = new StatusGroup('VMWARE', 'VMware');

  private readonly name: string;

  protected constructor(value: string, name: string) {
    super(value);
    this.name = name;
  }

  toString() {
    return this.name || super.toString();
  }
}
