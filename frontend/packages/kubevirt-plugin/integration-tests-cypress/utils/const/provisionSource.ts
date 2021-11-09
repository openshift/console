import { ObjectEnum } from '../../../src/constants/object-enum';
import { IMAGE_URL } from './index';

export const IMAGE_WIN10 =
  'http://cnv-qe-server.rhevdev.lab.eng.rdu2.redhat.com/files/cnv-tests/windows-images/win_10.qcow2';

export class ProvisionSource extends ObjectEnum<string> {
  static readonly URL = new ProvisionSource('URL', 'Import via URL (creates PVC)', IMAGE_URL);

  static readonly WIN10_URL = new ProvisionSource(
    'URL',
    'Import via URL (creates PVC)',
    IMAGE_WIN10,
  );

  static readonly REGISTRY = new ProvisionSource(
    'Registry',
    'Import via Registry (creates PVC)',
    'quay.io/kubevirt/cirros-container-disk-demo:latest',
  );

  static readonly EPHEMERAL = new ProvisionSource(
    'Ephemeral',
    'Container (ephemeral)',
    'quay.io/kubevirt/cirros-container-disk-demo:latest',
  );

  static readonly PXE = new ProvisionSource('PXE', 'PXE (network boot - adds network interface)');

  static readonly CLONE_PVC = new ProvisionSource('Clone', 'Clone existing PVC (creates PVC)');

  static readonly UPLOAD = new ProvisionSource('Upload', 'Upload local file (creates PVC)');

  static readonly EXISTING = new ProvisionSource('Use', 'Use an existing PVC');

  static readonly BLANK = new ProvisionSource('Blank', 'Blank (creates PVC)');

  private readonly description: string;

  private readonly source: string;

  protected constructor(value: string, description: string, source?: string) {
    super(value);
    this.description = description;
    this.source = source;
  }

  public getDescription = () => this.description;

  public getSource = () => this.source;

  public getValue = (): string => this.value;
}
