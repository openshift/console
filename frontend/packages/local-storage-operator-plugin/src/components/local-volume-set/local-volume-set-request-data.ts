import { apiVersionForModel } from '@console/internal/module/k8s';
import { LocalVolumeSetModel } from '../../models';
import { LocalVolumeSetKind, DiskType, DiskMechanicalProperties } from './types';
import { State } from './state';
import { LOCAL_STORAGE_NAMESPACE, HOSTNAME_LABEL_KEY, LABEL_OPERATOR } from '../../constants';
import { getNodes, getHostNames } from '../../utils';

export const getLocalVolumeSetRequestData = (state: State): LocalVolumeSetKind => {
  const nodes = getNodes(state.showNodesListOnLVS, state.nodeNamesForLVS, state.nodeNames);
  const requestData = {
    apiVersion: apiVersionForModel(LocalVolumeSetModel),
    kind: LocalVolumeSetModel.kind,
    metadata: { name: state.volumeSetName, namespace: LOCAL_STORAGE_NAMESPACE },
    spec: {
      storageClassName: state.storageClassName || state.volumeSetName,
      volumeMode: state.diskMode,
      deviceInclusionSpec: {
        deviceTypes: [DiskType.RawDisk, DiskType.Partition],
        deviceMechanicalProperties:
          state.diskType === 'HDD'
            ? [DiskMechanicalProperties[state.diskType]]
            : [DiskMechanicalProperties.SSD],
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

  if (state.maxDiskLimit) requestData.spec.maxDeviceCount = +state.maxDiskLimit;
  if (state.minDiskSize)
    requestData.spec.deviceInclusionSpec.minSize = `${state.minDiskSize}${state.diskSizeUnit}`;
  if (state.maxDiskSize)
    requestData.spec.deviceInclusionSpec.maxSize = `${state.maxDiskSize}${state.diskSizeUnit}`;

  return requestData;
};
