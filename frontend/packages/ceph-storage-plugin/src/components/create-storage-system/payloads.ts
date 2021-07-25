import { apiVersionForModel, k8sPatchByName } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { Payload } from './external-storage/types';
import { WizardNodeState, WizardState } from './reducer';
import { CEPH_STORAGE_NAMESPACE, defaultRequestSize, NO_PROVISIONER } from '../../constants';
import { NooBaaSystemModel, OCSServiceModel, StorageSystemModel } from '../../models';
import { getOCSRequestData } from '../ocs-install/ocs-request-data';
import { capacityAndNodesValidate } from '../../utils/create-storage-system';
import { ValidationType } from '../../utils/common-ocs-install-el';
import { cephStorageLabel } from '../../selectors';
import { StorageClusterSystemName } from '../../constants/create-storage-system';

export const createSSPayload = (systemKind: string, systemName: string): Payload => {
  const { apiGroup, apiVersion, kind, plural } = StorageSystemModel;
  return {
    model: {
      apiGroup,
      apiVersion,
      kind,
      plural,
    },
    payload: {
      apiVersion: apiVersionForModel(StorageSystemModel),
      kind,
      metadata: {
        name: systemName,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
      spec: {
        name: systemName,
        kind: systemKind,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
    },
  };
};

export const createNoobaaPayload = (): Payload => {
  const { apiGroup, apiVersion, kind, plural } = NooBaaSystemModel;

  return {
    model: {
      apiGroup,
      apiVersion,
      kind,
      plural,
    },
    payload: {
      apiVersion,
      kind,
      metadata: { name: 'noobaa', namespace: CEPH_STORAGE_NAMESPACE },
      spec: {
        dbResources: { requests: { cpu: '0.1', memory: '1Gi' } },
        dbType: 'postgres',
        coreResources: {
          requests: {
            cpu: '0.1',
            memory: '1Gi',
          },
        },
      },
    },
  };
};

export const createStorageClusterPayload = (state: WizardState): Payload => {
  const { apiGroup, apiVersion, kind, plural } = OCSServiceModel;
  const { storageClass, capacityAndNodes, securityAndNetwork } = state;
  const { nodes, capacity, enableArbiter, pvCount } = capacityAndNodes;
  const { encryption, publicNetwork, clusterNetwork, kms } = securityAndNetwork;

  const storage =
    storageClass?.provisioner === NO_PROVISIONER ? defaultRequestSize.BAREMETAL : capacity;

  const validations = capacityAndNodesValidate(nodes, enableArbiter);

  const isMinimal = validations.includes(ValidationType.MINIMAL);

  const isFlexibleScaling = validations.includes(ValidationType.ATTACHED_DEVICES_FLEXIBLE_SCALING);

  const payload = getOCSRequestData(
    storageClass,
    storage,
    encryption.clusterWide,
    isMinimal,
    isFlexibleScaling,
    publicNetwork,
    clusterNetwork,
    kms.hasHandled && encryption.advanced,
    null,
    null,
    pvCount,
    StorageClusterSystemName,
  );
  return {
    model: {
      apiGroup,
      apiVersion,
      kind,
      plural,
    },
    payload,
  };
};

export const labelNodes = (nodes: WizardNodeState[]): Promise<WizardNodeState>[] => {
  const patch = [
    {
      op: 'add',
      path: '/metadata/labels/cluster.ocs.openshift.io~1openshift-storage',
      value: '',
    },
  ];
  const requests: Promise<WizardNodeState>[] = [];
  nodes.forEach((node) => {
    if (!node.labels?.[cephStorageLabel])
      requests.push(k8sPatchByName(NodeModel, node.name, null, patch));
  });
  return requests;
};
