import * as _ from 'lodash';
import {
  apiVersionForModel,
  K8sResourceCommon,
  MatchExpression,
  Toleration,
  k8sCreate,
  k8sPatch,
  k8sGet,
} from '@console/internal/module/k8s';
import { getNodeSelectorTermsIndices } from '@console/local-storage-operator-plugin/src/utils';
import { DISCOVERY_CR_NAME, HOSTNAME_LABEL_KEY, LABEL_OPERATOR } from '../../constants';
import { LocalVolumeDiscovery } from '../../models';

export const getDiscoveryRequestData = (
  nodes: string[],
  ns: string,
  toleration?: Toleration,
): LocalVolumeDiscoveryKind => {
  const request: LocalVolumeDiscoveryKind = {
    apiVersion: apiVersionForModel(LocalVolumeDiscovery),
    kind: LocalVolumeDiscovery.kind,
    metadata: { name: DISCOVERY_CR_NAME, namespace: ns },
    spec: {
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
  };
  if (!_.isEmpty(toleration)) request.spec.tolerations = [toleration];
  return request;
};

export const updateLocalVolumeDiscovery = async (nodes, ns, setError) => {
  const lvd: LocalVolumeDiscoveryKind = await k8sGet(LocalVolumeDiscovery, DISCOVERY_CR_NAME, ns);
  const nodeSelectorTerms = lvd?.spec?.nodeSelector?.nodeSelectorTerms;
  const [selectorIndex, expIndex] = getNodeSelectorTermsIndices(nodeSelectorTerms);
  if (selectorIndex !== -1 && expIndex !== -1) {
    const existingNodes = new Set(
      lvd?.spec?.nodeSelector?.nodeSelectorTerms?.[selectorIndex]?.matchExpressions?.[
        expIndex
      ]?.values,
    );
    nodes.forEach((name) => existingNodes.add(name));
    const patch = [
      {
        op: 'replace',
        path: `/spec/nodeSelector/nodeSelectorTerms/${selectorIndex}/matchExpressions/${expIndex}/values`,
        value: [...existingNodes],
      },
    ];
    await k8sPatch(LocalVolumeDiscovery, lvd, patch);
    setError('');
  } else {
    throw new Error(
      'Could not find matchExpression of type key: "kubernetes.io/hostname" and operator: "In"',
    );
  }
};

export const createLocalVolumeDiscovery = async (nodes, ns, toleration?) => {
  const requestData = getDiscoveryRequestData(nodes, ns, toleration);
  await k8sCreate(LocalVolumeDiscovery, requestData);
};

export type LocalVolumeDiscoveryKind = K8sResourceCommon & {
  spec: {
    nodeSelector?: {
      nodeSelectorTerms: { matchExpressions: MatchExpression[]; matchFields?: MatchExpression[] }[];
    };
    tolerations?: Toleration[];
  };
};
