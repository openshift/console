import * as _ from 'lodash';
import { apiVersionForModel, Toleration } from '@console/internal/module/k8s';
import { LocalVolumeSetModel } from '../../models';
import { LocalVolumeSetKind, DiskType } from './types';
import { State } from './state';
import { getNodes, getHostNames } from '../../utils';
import {
  DISK_TYPES,
  HOSTNAME_LABEL_KEY,
  LABEL_OPERATOR,
  deviceTypeDropdownItems,
} from '../../constants';

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
  ns: string,
  toleration?: Toleration,
): LocalVolumeSetKind => {
  const nodes = getNodes(state.showNodesListOnLVS, state.nodeNamesForLVS, state.nodeNames);
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
                values: getHostNames(nodes, state.hostNamesMapForLVS),
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
