import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

type DataVolumeTemplateArgs = {
  name: string;
  pvcSourceName: string;
  pvcSourceNamespace: string;
  accessModes?: string[] | object[];
  volumeMode: string;
  size: string;
  unit?: string;
  storageClassName?: string;
};

/**
 * @deprecated FIXME deprecate in favor of DataVolumeWrapper
 */
export class DataVolumeTemplate {
  private data: K8sResourceKind;

  constructor({
    name,
    pvcSourceName,
    pvcSourceNamespace,
    accessModes,
    volumeMode,
    size,
    unit,
    storageClassName,
  }: DataVolumeTemplateArgs) {
    this.data = {
      metadata: {
        name,
      },
      spec: {
        source: {
          pvc: {
            name: pvcSourceName,
            namespace: pvcSourceNamespace,
          },
        },
        pvc: {
          accessModes: _.cloneDeep(accessModes),
          volumeMode,
          resources: {
            requests: {
              storage: size && unit ? `${size}${unit}` : size,
            },
          },
          storageClassName,
        },
      },
    };
  }

  build = () => _.cloneDeep(this.data);
}
