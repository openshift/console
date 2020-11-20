/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';

export class StatusGroup extends ObjectEnum<string> {
  static readonly RHV = new StatusGroup('RHV', 'RHV', 'Red Hat Virtualization');
  static readonly VMWARE = new StatusGroup('VMWARE', 'VMware', 'VMware');

  private readonly name: string;

  private readonly verboseName: string;

  protected constructor(value: string, name: string, verboseName: string) {
    super(value);
    this.name = name;
    this.verboseName = verboseName;
  }

  getVerboseName = () => this.verboseName;

  toString() {
    return this.name || super.toString();
  }
}
