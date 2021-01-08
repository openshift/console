import * as _ from 'lodash';
import { apiVersionForModel, K8sResourceCommon, Toleration } from '@console/internal/module/k8s';
import { LocalVolumeDiscovery as AutoDetectVolumeModel } from '../../models';
import { DISCOVERY_CR_NAME, HOSTNAME_LABEL_KEY, LABEL_OPERATOR } from '../../constants';
import { getNodes, getHostNames } from '../../utils';
import { HostNamesMap } from './types';

export const getDiscoveryRequestData = ({
  nodeNamesForLVS,
  allNodeNamesOnADV,
  showNodesListOnADV,
  hostNamesMapForADV,
  ns,
  toleration,
}: {
  nodeNamesForLVS: string[];
  allNodeNamesOnADV: string[];
  showNodesListOnADV: boolean;
  hostNamesMapForADV: HostNamesMap;
  ns: string;
  toleration?: Toleration;
}): AutoDetectVolumeKind => {
  const nodes = getNodes(showNodesListOnADV, allNodeNamesOnADV, nodeNamesForLVS);
  const request: AutoDetectVolumeKind = {
    apiVersion: apiVersionForModel(AutoDetectVolumeModel),
    kind: AutoDetectVolumeModel.kind,
    metadata: { name: DISCOVERY_CR_NAME, namespace: ns },
    spec: {
      nodeSelector: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: HOSTNAME_LABEL_KEY,
                operator: LABEL_OPERATOR,
                values: getHostNames(nodes, hostNamesMapForADV),
              },
            ],
          },
        ],
      },
    },
  };
  if (!_.isEmpty(toleration)) request.spec.tolerations = [toleration];
  return request;
};

type AutoDetectVolumeKind = K8sResourceCommon & {
  spec: {
    nodeSelector?: {
      nodeSelectorTerms: [
        {
          matchExpressions: [{ key: string; operator: string; values: string[] }];
        },
      ];
    };
    tolerations?: Toleration[];
  };
};
