import { ObjectEnum } from '@console/shared/src/constants/object-enum';

export class ProvisionSource extends ObjectEnum<string> {
  static readonly URL = new ProvisionSource(
    'URL',
    'URL (adds disk)',
    'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img',
  );

  static readonly CONTAINER = new ProvisionSource(
    'Container',
    'Container',
    'kubevirt/fedora-cloud-registry-disk-demo:latest',
  );

  static readonly PXE = new ProvisionSource('PXE', 'PXE (network boot - adds network interface)');

  static readonly DISK = new ProvisionSource('Disk', 'Existing PVC (adds disk)');

  private readonly description: string;

  private readonly source: string;

  protected constructor(value: string, description: string, source?: string) {
    super(value);
    this.description = description;
    this.source = source || null;
  }

  public getDescription = () => this.description;

  public getSource = () => this.source;

  public getValue = (): string => this.value;
}
