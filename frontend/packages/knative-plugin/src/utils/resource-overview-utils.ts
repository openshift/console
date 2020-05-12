import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel as knServiceModel, RevisionModel } from '../models';
import { Traffic, RoutesOverviewListItem } from '../types';
/**
 * Return the knative routes list items.
 * @param route
 * @param resource | resource can be a knative service or revision;
 */
export const getKnativeRoutesLinks = (
  route: K8sResourceKind,
  resource: K8sResourceKind,
): RoutesOverviewListItem[] => {
  if (!route.status) {
    return [];
  }
  const {
    metadata: { name, namespace },
    status: {
      url = '',
      traffic: trafficData = [{ revisionName: resource.metadata.name, url: route?.status?.url }],
    },
  } = route;
  const filterTrafficBasedOnResource = (tr: Traffic) =>
    referenceFor(resource) === referenceForModel(knServiceModel) ||
    (referenceFor(resource) === referenceForModel(RevisionModel) &&
      tr.revisionName === resource.metadata.name);
  return trafficData
    .filter(filterTrafficBasedOnResource)
    .map((traffic: Traffic, index: number) => ({
      uid: `${traffic.revisionName}-${traffic?.tag ? traffic?.tag : 'tag'}-${index}`,
      url: traffic?.url || url,
      percent: traffic.percent ? `${traffic.percent}%` : '',
      name,
      namespace,
    }));
};
