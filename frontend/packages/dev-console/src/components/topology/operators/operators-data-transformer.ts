import * as _ from 'lodash';
import { EdgeModel, Model } from '@patternfly/react-topology';
import {
  K8sResourceKind,
  LabelSelector,
  modelFor,
  referenceFor,
} from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';
import { getOperatorBackedServiceKindMap } from '@console/shared';
import { isOperatorBackedKnResource } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { WORKLOAD_TYPES } from '../topology-utils';
import { TYPE_SERVICE_BINDING } from '../components';
import { TopologyDataResources } from '../topology-types';

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
    if (reference && sbr?.spec?.applicationSelector?.resource === modelFor(reference)?.plural) {
      if (sbr?.spec?.applicationSelector?.resourceRef === source.metadata.name) {
        edgeExists = true;
      } else {
        const matchLabels = sbr?.spec?.applicationSelector?.matchLabels;
        if (matchLabels) {
          const sbrSelector = new LabelSelector(sbr.spec.applicationSelector);
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

export const getServiceBindingEdges = (
  dc: K8sResourceKind,
  obsGroups: K8sResourceKind[],
  sbrs: K8sResourceKind[],
  installedOperators: K8sResourceKind[],
): EdgeModel[] => {
  const edges = [];
  if (!sbrs?.length || !installedOperators?.length) {
    return edges;
  }

  _.forEach(edgesFromServiceBinding(dc, sbrs), (sbr) => {
    // look for multiple backing services first in `backingServiceSelectors`
    // followed by a fallback to the single reference in `backingServiceSelector`
    _.forEach(sbr.spec.backingServiceSelectors || [sbr.spec.backingServiceSelector], (bss) => {
      if (bss) {
        const targetGroup = obsGroups.find(
          (group) => group.kind === bss.kind && group.metadata.name === bss.resourceRef,
        );
        const target = targetGroup?.metadata.uid;
        const source = dc.metadata.uid;
        if (source && target) {
          edges.push({
            id: `${source}_${target}`,
            type: TYPE_SERVICE_BINDING,
            source,
            target,
            resource: sbr,
            data: { sbr },
          });
        }
      }
    });
  });

  return edges;
};

const isOperatorBackedService = (
  obj: K8sResourceKind,
  installedOperators: ClusterServiceVersionKind[],
  resources?: TopologyDataResources,
): boolean => {
  const kind = _.get(obj, 'metadata.ownerReferences[0].kind', null);
  const ownerUid = _.get(obj, 'metadata.ownerReferences[0].uid');
  // added this as needs to hide oprator backed if belong to source
  if (resources && isOperatorBackedKnResource(obj, resources)) {
    return false;
  }
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  const operatorResource: K8sResourceKind = _.find(installedOperators, {
    metadata: { uid: ownerUid },
  }) as K8sResourceKind;
  return !!(
    kind &&
    operatorBackedServiceKindMap &&
    (!_.isEmpty(operatorResource) || kind in operatorBackedServiceKindMap)
  );
};

export const getOperatorGroupResource = (
  resource: K8sResourceKind,
  resources?: TopologyDataResources,
): K8sResourceKind => {
  const installedOperators = resources?.clusterServiceVersions?.data as ClusterServiceVersionKind[];
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);

  if (isOperatorBackedService(resource, installedOperators, resources)) {
    const ownerReference = resource?.metadata?.ownerReferences?.[0];
    const ownerUid = ownerReference?.uid;
    const nodeResourceKind = ownerReference?.kind;
    const operatorBackedServiceKind = operatorBackedServiceKindMap?.[nodeResourceKind];
    const appGroup = resource?.metadata?.labels?.['app.kubernetes.io/part-of'];
    const operator: K8sResourceKind =
      (installedOperators.find((op) => op.metadata.uid === ownerUid) as K8sResourceKind) ||
      operatorBackedServiceKind;

    const operatorName =
      ownerReference?.name ?? appGroup
        ? `${appGroup}:${operator.metadata.name}`
        : operator.metadata.name;

    const groupUid = ownerReference?.uid ?? `${operatorName}:${operator.metadata.uid}`;
    return _.merge({}, operator, {
      apiVersion: ownerReference?.apiVersion ?? '',
      kind: ownerReference?.kind ?? 'Operator',
      metadata: {
        name: ownerReference?.name ?? operator.metadata.name,
        uid: groupUid,
      },
    });
  }
  return null;
};

export const getOperatorGroupResources = (resources: TopologyDataResources) => {
  const obsGroups = [];
  WORKLOAD_TYPES.forEach((key) => {
    if (resources[key]?.data && resources[key].data.length) {
      resources[key].data.forEach((resource) => {
        const group = getOperatorGroupResource(resource, resources);
        if (!group) {
          return;
        }
        obsGroups.push(group);
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
  const serviceBindingRequests = resources?.serviceBindingRequests?.data;
  const installedOperators = resources?.clusterServiceVersions?.data as ClusterServiceVersionKind[];

  if (serviceBindingRequests?.length && installedOperators?.length) {
    workloads.forEach((dc) => {
      operatorsDataModel.edges.push(
        ...getServiceBindingEdges(dc, obsGroups, serviceBindingRequests, installedOperators),
      );
    });
  }

  return Promise.resolve(operatorsDataModel);
};
