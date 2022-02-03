import * as _ from 'lodash';
import { plural } from 'pluralize';
import { Dispatch } from 'redux';
import { DiscoveryResources, K8sModel } from '../../../api/common-types';
import { consoleFetchJSON } from '../../../utils/fetch/console-fetch';
import { k8sBasePath } from '../../../utils/k8s/k8s';
import { kindToAbbr } from '../../../utils/k8s/k8s-get-resource';
import { getResourcesInFlight, receivedResources } from '../actions/k8s';
import { APIResourceList, InitApiDiscovery } from './api-discovery-types';
import { cacheResources, getCachedResources } from './discovery-cache';

const POLLs = {};
const apiDiscovery = 'apiDiscovery';
const API_DISCOVERY_POLL_INTERVAL = 60_000;

const pluralizeKind = (kind: string): string => {
  // Use startCase to separate words so the last can be pluralized but remove spaces so as not to humanize
  const pluralized = plural(_.startCase(kind)).replace(/\s+/g, '');
  // Handle special cases like DB -> DBs (instead of DBS).
  if (pluralized === `${kind}S`) {
    return `${kind}s`;
  }
  return pluralized;
};

const defineModels = (list: APIResourceList): K8sModel[] => {
  const groupVersionParts = list.groupVersion.split('/');
  const apiGroup = groupVersionParts.length > 1 ? groupVersionParts[0] : null;
  const apiVersion = groupVersionParts.length > 1 ? groupVersionParts[1] : list.groupVersion;
  return list.resources
    .filter(({ name }) => !name.includes('/'))
    .map(({ name, singularName, namespaced, kind, verbs, shortNames }) => {
      return {
        kind,
        namespaced,
        verbs,
        shortNames,
        label: kind,
        plural: name,
        apiVersion,
        abbr: kindToAbbr(kind),
        ...(apiGroup ? { apiGroup } : {}),
        labelPlural: pluralizeKind(kind),
        path: name,
        id: singularName,
        crd: true,
      };
    });
};

const getResources = async (): Promise<DiscoveryResources> => {
  const apiResourceData = await consoleFetchJSON(`${k8sBasePath}/apis`);
  const groupVersionMap = apiResourceData.groups.reduce(
    (acc, { name, versions, preferredVersion: { version } }) => {
      acc[name] = {
        versions: _.map(versions, 'version'),
        preferredVersion: version,
      };
      return acc;
    },
    {},
  );
  const all: Promise<APIResourceList>[] = _.flatten(
    apiResourceData.groups.map((group) =>
      group.versions.map((version) => `/apis/${version.groupVersion}`),
    ),
  )
    .concat(['/api/v1'])
    .map((p) => consoleFetchJSON(`api/kubernetes${p}`).catch((err) => err));

  return Promise.all(all).then((data) => {
    const resourceSet = new Set<string>();
    const namespacedSet = new Set<string>();
    data.forEach(
      (d) =>
        d.resources &&
        d.resources.forEach(({ namespaced, name }) => {
          resourceSet.add(name);
          namespaced && namespacedSet.add(name);
        }),
    );
    const allResources = [...resourceSet].sort();

    const safeResources = [];
    const adminResources = [];
    const models = _.flatten(data.filter((d) => d.resources).map(defineModels));
    const coreResources = new Set([
      'roles',
      'rolebindings',
      'clusterroles',
      'clusterrolebindings',
      'thirdpartyresources',
      'nodes',
      'secrets',
    ]);
    allResources.forEach((r) =>
      coreResources.has(r.split('/')[0]) ? adminResources.push(r) : safeResources.push(r),
    );
    const configResources = _.filter(
      models,
      (m) => m.apiGroup === 'config.openshift.io' && m.kind !== 'ClusterOperator',
    );
    const clusterOperatorConfigResources = _.filter(
      models,
      (m) => m.apiGroup === 'operator.openshift.io',
    );

    return {
      allResources,
      safeResources,
      adminResources,
      configResources,
      clusterOperatorConfigResources,
      namespacedSet,
      models,
      groupVersionMap,
    } as DiscoveryResources;
  });
};

const updateResources = () => (dispatch: Dispatch) => {
  dispatch(getResourcesInFlight());

  getResources()
    .then((resources) => {
      // Cache the resources whenever discovery completes to improve console load times.
      cacheResources(resources);
      dispatch(receivedResources(resources));
    })
    // eslint-disable-next-line no-console
    .catch((err) => console.error('Fetching resource failed:', err));
};

const startAPIDiscovery = () => (dispatch) => {
  // eslint-disable-next-line no-console
  console.log('API discovery method: Polling');
  // Poll API discovery every 30 seconds since we can't watch CRDs
  dispatch(updateResources());
  if (POLLs[apiDiscovery]) {
    clearTimeout(POLLs[apiDiscovery]);
    delete POLLs[apiDiscovery];
  }
  POLLs[apiDiscovery] = setTimeout(
    () => dispatch(startAPIDiscovery()),
    API_DISCOVERY_POLL_INTERVAL,
  );
};

export const initApiDiscovery: InitApiDiscovery = (storeInstance) => {
  getCachedResources()
    .then((resources) => {
      if (resources) {
        storeInstance.dispatch(receivedResources(resources));
      }
      // Still perform discovery to refresh the cache.
      storeInstance.dispatch(startAPIDiscovery());
    })
    .catch(() => storeInstance.dispatch(startAPIDiscovery()));
};
