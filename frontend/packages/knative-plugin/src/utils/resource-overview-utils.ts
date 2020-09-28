import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel as knServiceModel, RevisionModel } from '../models';
import { Traffic, RoutesOverviewListItem } from '../types';

export const filterTrafficBasedOnResource = (resource) => (tr: Traffic) =>
  referenceFor(resource) === referenceForModel(knServiceModel) ||
  (referenceFor(resource) === referenceForModel(RevisionModel) &&
    tr.revisionName === resource.metadata.name);
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
    status: { url = '', traffic: trafficData = [{ revisionName: resource.metadata.name }] },
  } = route;

  return trafficData
    .filter(filterTrafficBasedOnResource(resource))
    .map((traffic: Traffic, index: number) => ({
      uid: `${traffic.revisionName}-${traffic?.tag ? traffic?.tag : 'tag'}-${index}`,
      url,
      percent: traffic.percent ? `${traffic.percent}%` : '',
      name,
      namespace,
    }));
};

/**
 * Return the grouped knative resource by revision name.
 * @param route
 * @param resource | resource can be a knative service or revision;
 */
export const groupTrafficByRevision = (route: K8sResourceKind, resource: K8sResourceKind) => {
  if (!route.status) {
    return [];
  }
  const {
    status: { traffic: trafficData = [{ revisionName: resource.metadata.name }] },
  } = route;

  const tData = trafficData.filter(filterTrafficBasedOnResource(resource)).reduce(
    (acc, traffic: Traffic) => {
      traffic.url && acc.urls.push(traffic.url);
      acc.percent += traffic.percent ? traffic.percent : 0;
      return acc;
    },
    {
      urls: [],
      percent: 0,
    },
  );
  return { ...tData, percent: tData.percent ? `${tData.percent}%` : '' };
};
