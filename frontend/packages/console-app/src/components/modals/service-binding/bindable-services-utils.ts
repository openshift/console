import * as _ from 'lodash';
import { getBindableServiceResources } from '@console/dev-console/src/components/topology/bindable-services/bindable-service-resources';
import { referenceForGroupVersionKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';
import { getOperatorBackedServiceKindMap } from '@console/shared/src';

export type OwnedResourceType = {
  displayName: string;
  kind: string;
  name: string;
  version: string;
};

export type ClusterServiceVersionDataType = {
  data: ClusterServiceVersionKind[];
  loaded: boolean;
  loadError: string;
};

export const getGroupVersionKindFromOperatorBackedServiceKindMap = (
  obj: ClusterServiceVersionKind,
  obsResourceKind: string,
): { group: string; version: string; kind: string } => {
  const ownedResource: OwnedResourceType = obj.spec?.customresourcedefinitions?.owned?.find(
    (o) => o.kind === obsResourceKind,
  );
  const apiGroup = ownedResource.name.substring(
    ownedResource.name.indexOf('.') + 1,
    ownedResource.name.length,
  );
  return { group: apiGroup, version: ownedResource.version, kind: ownedResource.kind };
};

export const getOperatorBackedServiceResources = (
  namespace: string,
  csvs: ClusterServiceVersionDataType,
) => {
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(csvs?.data);
  const obsResources = Object.keys(operatorBackedServiceKindMap).map((obs: string) => {
    const { group, version, kind } = getGroupVersionKindFromOperatorBackedServiceKindMap(
      operatorBackedServiceKindMap[obs],
      obs,
    );
    return (
      kind !== 'ServiceBinding' && {
        isList: true,
        kind: referenceForGroupVersionKind(group)(version)(kind),
        namespace,
        optional: true,
        prop: obs,
      }
    );
  });
  return obsResources;
};

export const getBindableResources = (namespace: string, csvs: ClusterServiceVersionDataType) => {
  const bindableRes = _.omit(
    {
      ...getBindableServiceResources(namespace),
      ...getOperatorBackedServiceResources(namespace, csvs),
    },
    'serviceBindingRequests',
  );

  const res = Object.keys(bindableRes).map((key) => bindableRes[key]);
  return res;
};
