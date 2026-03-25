import type { Model } from '@patternfly/react-topology/dist/esm/types';
import * as _ from 'lodash';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { LabelSelector, modelFor, referenceFor } from '@console/internal/module/k8s';
import { isOperatorBackedKnResource } from '@console/knative-plugin/src/topology/knative-topology-utils';
import type { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';
import {
  isOperatorBackedService,
  getOperatorBackedServiceKindMap,
} from '@console/shared/src/utils/operator-utils';
import { getTopologyEdgeItems } from '../data-transforms/transform-utils';
import type { TopologyDataResources } from '../topology-types';
import { WORKLOAD_TYPES } from '../utils/topology-utils';

export const edgesFromServiceBinding = (
  source: K8sResourceKind,
  sbrs: K8sResourceKind[],
): K8sResourceKind[] => {
  const sourceBindings = [];
  if (!sbrs) {
    return sourceBindings;
  }
  sbrs.forEach((sbr) => {
    let edgeExists = false;
    const reference = referenceFor(source);
    if (reference && sbr?.spec?.application?.resource === modelFor(reference)?.plural) {
      if (sbr?.spec?.application?.name === source.metadata.name) {
        edgeExists = true;
      } else {
        const matchLabels = sbr?.spec?.application?.labelSelector?.matchLabels;
        if (matchLabels) {
          const sbrSelector = new LabelSelector(sbr.spec.application.labelSelector);
          if (sbrSelector.matches(source)) {
            edgeExists = true;
          }
        }
      }
    }
    edgeExists && sourceBindings.push(sbr);
  });
  return sourceBindings;
};

export const getOperatorGroupResource = (
  resource: K8sResourceKind,
  resources?: TopologyDataResources,
): { operatorGroupItem: K8sResourceKind; csvName: string } => {
  const installedOperators = resources?.clusterServiceVersions?.data as ClusterServiceVersionKind[];
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  // added this as needs to hide operator backed if belong to source
  if (resources && isOperatorBackedKnResource(resource, resources)) {
    return null;
  }

  if (isOperatorBackedService(resource, installedOperators)) {
    const ownerReference = resource?.metadata?.ownerReferences?.[0];
    const ownerUid = ownerReference?.uid;
    const nodeResourceKind = ownerReference?.kind;
    const operatorBackedServiceKind = operatorBackedServiceKindMap?.[nodeResourceKind];
    const appGroup = resource?.metadata?.labels?.['app.kubernetes.io/part-of'];
    const operator: K8sResourceKind =
      (installedOperators.find((op) => op.metadata.uid === ownerUid) as K8sResourceKind) ||
      operatorBackedServiceKind;
    const csvName = operator.metadata.name;
    const operatorName =
      ownerReference?.name ?? appGroup
        ? `${appGroup}:${operator.metadata.name}`
        : operator.metadata.name;

    const groupUid = ownerReference?.uid ?? `${operatorName}:${operator.metadata.uid}`;
    const operatorGroupItem = _.merge({}, operator, {
      apiVersion: ownerReference?.apiVersion ?? '',
      kind: ownerReference?.kind ?? 'Operator',
      metadata: {
        name: ownerReference?.name ?? operator.metadata.name,
        uid: groupUid,
      },
    });
    return { operatorGroupItem, csvName };
  }
  return null;
};

export const getOperatorGroupResources = (resources: TopologyDataResources) => {
  const obsGroups = [];
  WORKLOAD_TYPES.forEach((key) => {
    if (resources[key]?.data && resources[key].data.length) {
      resources[key].data.forEach((resource) => {
        const groupResource = getOperatorGroupResource(resource, resources);
        if (!groupResource?.operatorGroupItem) {
          return;
        }
        obsGroups.push(groupResource.operatorGroupItem);
      });
    }
  });
  return obsGroups;
};

export const getOperatorTopologyDataModel = (
  namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceKind[],
): Promise<Model> => {
  const operatorsDataModel: Model = {
    nodes: [],
    edges: [],
  };
  const obsGroups = getOperatorGroupResources(resources);
  const installedOperators = resources?.clusterServiceVersions?.data as ClusterServiceVersionKind[];
  if (installedOperators?.length) {
    workloads.forEach((dc) => {
      operatorsDataModel.edges.push(...[...getTopologyEdgeItems(dc, obsGroups)]);
    });
  }

  return Promise.resolve(operatorsDataModel);
};
