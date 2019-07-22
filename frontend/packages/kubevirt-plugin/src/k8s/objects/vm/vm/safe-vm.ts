import * as _ from 'lodash';
import { VMKind } from '../../../../types/vm';
import {
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getNetworks,
  getVolumes,
} from '../../../../selectors/vm';
import { SafeMetadata } from '../../common/safe-metadata';
import { getLabels } from '../../../../selectors/selectors';

export class SafeVM {
  protected data: VMKind;

  constructor(vm?: VMKind) {
    const safeVM = (_.cloneDeep(vm) || {}) as VMKind;

    this.data = {
      ...safeVM,
      metadata: new SafeMetadata(safeVM.metadata).build(),
      spec: {
        ..._.get(safeVM, 'spec'),
        template: {
          ..._.get(safeVM, 'spec.template'),
          metadata: new SafeMetadata(_.get(safeVM, 'spec.template.metadata')).build(),
          spec: {
            ..._.get(safeVM, 'spec.template.spec'),
            domain: {
              ..._.get(safeVM, 'spec.template.spec.domain'),
              cpu: _.get(safeVM, 'spec.template.spec.domain.cpu', {}),
              devices: {
                ..._.get(safeVM, 'spec.template.spec.domain.devices'),
                disks: getDisks(safeVM),
                interfaces: getInterfaces(safeVM),
              },
              resources: {
                ..._.get(safeVM, 'spec.template.spec.domain.resources'),
                requests: _.get(safeVM, 'spec.template.spec.domain.resources.requests', {}),
              },
            },
            networks: getNetworks(safeVM),
            volumes: getVolumes(safeVM),
            tolerations: _.get(safeVM, 'spec.template.spec.tolerations', []),
          },
        },
        dataVolumeTemplates: getDataVolumeTemplates(safeVM),
      },
      status: {
        ..._.get(safeVM, 'status', {}),
        conditions: _.get(safeVM, 'status.conditions', []),
        stateChangeRequests: _.get(safeVM, 'status.stateChangeRequests', []),
      },
    };

    this.build = this.build.bind(this);
    this.buildClean = this.buildClean.bind(this);
  }

  getInterfaces = () => getInterfaces(this.data);

  getNetworks = () => getNetworks(this.data);

  getDisks = () => getDisks(this.data);

  getLabels = () => getLabels(this.data);

  getTemplateLabels = () => getLabels(this.data.spec.template);

  getVolumes = () => getVolumes(this.data);

  getDataVolumeTemplates = () => getDataVolumeTemplates(this.data);

  build() {
    return _.cloneDeep(this.data);
  }

  buildClean() {
    const vm = _.cloneDeep(this.data);

    // clean superfluous values
    [
      'metadata.annotations',
      'metadata.labels',
      'metadata.ownerReferences',
      'spec.template.metadata.annotations',
      'spec.template.metadata.labels',
      'spec.template.metadata.ownerReferences',
      'spec.template.spec.domain.cpu',
      'spec.template.spec.domain.devices.disks',
      'spec.template.spec.domain.devices.interfaces',
      'spec.template.spec.domain.resources.requests',
      'spec.template.spec.tolerations',
      'status.conditions',
      'status.stateChangeRequests',
      'spec.dataVolumeTemplates',
    ]
      .map((path) => path.split('.'))
      .filter((path) => _.isEmpty(_.get(vm, path)))
      .forEach((path) => {
        const parent = _.get(vm, path.slice(0, path.length - 1));
        const removeProperty = path[path.length - 1];
        if (parent) {
          delete parent[removeProperty];
        }
      });

    return vm;
  }
}
