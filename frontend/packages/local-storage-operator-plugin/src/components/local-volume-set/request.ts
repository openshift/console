import * as _ from 'lodash';
import { apiVersionForModel, Toleration } from '@console/internal/module/k8s';
import {
  DISK_TYPES,
  HOSTNAME_LABEL_KEY,
  LABEL_OPERATOR,
  deviceTypeDropdownItems,
} from '../../constants';
import { LocalVolumeSetModel } from '../../models';
import { State } from './state';
import { LocalVolumeSetKind, DiskType } from './types';

const getDeviceTypes = (deviceType: string[]) => {
  const { DISK, PART } = deviceTypeDropdownItems;
  if ((deviceType.includes(DISK) && deviceType.includes(PART)) || deviceType.length === 0) {
    return [DiskType.RawDisk, DiskType.Partition];
  }
  if (deviceType.includes(PART)) {
    return [DiskType.Partition];
  }
  return [DiskType.RawDisk];
};

export const getLocalVolumeSetRequestData = (
  state: State,
  nodes: string[],
  ns: string,
  toleration?: Toleration,
): LocalVolumeSetKind => {
  const deviceTypes = getDeviceTypes(state.deviceType);
  const requestData = {
    apiVersion: apiVersionForModel(LocalVolumeSetModel),
    kind: LocalVolumeSetModel.kind,
    metadata: { name: state.volumeSetName, namespace: ns },
    spec: {
      storageClassName: state.storageClassName || state.volumeSetName,
      volumeMode: state.diskMode,
      deviceInclusionSpec: {
        deviceTypes,
      },
      nodeSelector: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: HOSTNAME_LABEL_KEY,
                operator: LABEL_OPERATOR,
                values: nodes,
              },
            ],
          },
        ],
      },
    },
  } as LocalVolumeSetKind;

  if (!_.isEmpty(toleration)) requestData.spec.tolerations = [toleration];
  if (state.maxDiskLimit) requestData.spec.maxDeviceCount = +state.maxDiskLimit;
  if (state.minDiskSize)
    requestData.spec.deviceInclusionSpec.minSize = `${state.minDiskSize}${state.diskSizeUnit}`;
  if (state.maxDiskSize)
    requestData.spec.deviceInclusionSpec.maxSize = `${state.maxDiskSize}${state.diskSizeUnit}`;
  if (DISK_TYPES[state.diskType]?.property) {
    requestData.spec.deviceInclusionSpec.deviceMechanicalProperties = [
      DISK_TYPES[state.diskType].property,
    ];
  }

  return requestData;
};
