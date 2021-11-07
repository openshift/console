import { isUpstream } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { getName } from '../../selectors';
import { ObjectEnum } from '../object-enum';

export class OSSelection extends ObjectEnum<string> {
  static readonly FEDORA = new OSSelection(
    'fedora',
    'quay.io/kubevirt/fedora-cloud-container-disk-demo:latest',
  );

  static readonly CENTOS = new OSSelection('centos', 'centos:latest');

  static readonly RHEL8 = new OSSelection('rhel8', 'registry.redhat.io/rhel8/rhel-guest-image');

  private readonly image: string;

  protected constructor(value: string, image?: string) {
    super(value);
    this.image = image;
  }

  public getContainerImage = () => this.image;

  static getAll = () =>
    isUpstream()
      ? [OSSelection.FEDORA, OSSelection.RHEL8, OSSelection.CENTOS]
      : [OSSelection.RHEL8, OSSelection.FEDORA, OSSelection.CENTOS];

  static findSuitableOSAndTemplate = (templates: TemplateKind[]) => {
    const sortedTemplates = [...templates].sort((a, b) => getName(b).localeCompare(getName(a)));
    let suitableTemplate = null;
    const osSelection = OSSelection.getAll().find((selection) => {
      const baseTemplate = sortedTemplates.find((t) => getName(t).includes(selection.getValue()));

      if (baseTemplate) {
        suitableTemplate = baseTemplate;
      }
      return baseTemplate;
    });

    return {
      template: suitableTemplate,
      osSelection,
    };
  };
}
