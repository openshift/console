import * as _ from 'lodash';
import { apiVersionForModel, Toleration } from '@console/internal/module/k8s';
import {
  DISK_TYPES,
  HOSTNAME_LABEL_KEY,
  LABEL_OPERATOR,
  deviceTypeDropdownItems,
} from '../../constants';
import { LocalVolumeSetModel } from '../../models';
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
  // @TODO: (afreen23) Fix the typings , this chanfge will require refactoring at mutiple places
  state: any,
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

  if (state.fsType) requestData.spec.fsType = state.fsType;
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
