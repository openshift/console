/* eslint-disable no-unused-vars, no-undef */

import * as _ from 'lodash-es';

import { coFetchJSON } from '../../co-fetch';
import { K8sKind } from '../../module/k8s';
import { API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY } from '../../const';

const ADMIN_RESOURCES = new Set(
  ['roles', 'rolebindings', 'clusterroles', 'clusterrolebindings', 'thirdpartyresources', 'nodes', 'secrets']
);

export const kindToAbbr = kind => (kind.replace(/[^A-Z]/g, '') || kind.toUpperCase()).slice(0, 3);

export const cacheResources = (resources) => new Promise<void>((resolve, reject) => {
  try {
    // Add the console version. We invalidate the cache when console version changes.
    const { consoleVersion } = (window as any).SERVER_FLAGS;
    const versionedResources = _.assign({}, resources, { consoleVersion });
    localStorage.setItem(API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY, JSON.stringify(versionedResources));
    resolve();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error caching API resources in localStorage', e);
    reject(e);
  }
});

export const getCachedResources = () => new Promise<any>((resolve, reject) => {
  try {
    const resourcesJSON = localStorage.getItem(API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);

    // Clear cached resources after load as a safeguard. If there's any errors
    // with the content that prevents the console from working, the bad data
    // will not be loaded when the user refreshes the console. The cache will
    // be refreshed when discovery completes.
    localStorage.removeItem(API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);

    if (resourcesJSON) {
      const resources = JSON.parse(resourcesJSON);
      const { consoleVersion: currentVersion } = (window as any).SERVER_FLAGS;
      const { consoleVersion: cachedVersion } = resources;
      if (cachedVersion !== currentVersion) {
        // eslint-disable-next-line no-console
        console.log(`Invalidating API discovery cache from earlier console version (current: ${currentVersion}, cached: ${cachedVersion})`);
        resolve(null);
        return;
      }
      // eslint-disable-next-line no-console
      console.log('Loaded cached API resources from localStorage');
      resolve(resources);
      return;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error reading API resources from localStorage', e);
    reject(e);
  }

  resolve(null);
});

export const getResources = () => coFetchJSON('api/kubernetes/apis')
  .then(res => {
    const preferredVersions = res.groups.map(group => group.preferredVersion);
    const all: Promise<APIResourceList>[] = _.flatten(res.groups
      .map(group => group.versions.map(version => `/apis/${version.groupVersion}`)))
      .concat(['/api/v1'])
      .map(p => coFetchJSON(`api/kubernetes${p}`).catch(err => err));

    return Promise.all(all)
      .then(data => {
        const resourceSet = new Set();
        const namespacedSet = new Set();
        data.forEach(d => d.resources && d.resources.forEach(({namespaced, name}) => {
          resourceSet.add(name);
          namespaced && namespacedSet.add(name);
        }));
        const allResources = [...resourceSet].sort();

        const safeResources = [];
        const adminResources = [];

        const defineModels = (list: APIResourceList): K8sKind[] => list.resources.filter(({name}) => !name.includes('/'))
          .map(({name, singularName, namespaced, kind, verbs}) => {
            const label = kind.replace(/([A-Z]+)/g, ' $1').slice(1);
            const groupVersion = list.groupVersion.split('/').length === 2 ? list.groupVersion : `core/${list.groupVersion}`;

            return {
              kind, namespaced, label, verbs,
              plural: name,
              apiVersion: groupVersion.split('/')[1],
              abbr: kindToAbbr(kind),
              apiGroup: groupVersion.split('/')[0],
              labelPlural: `${label}${label.endsWith('s') ? 'es' : 's'}`,
              path: name,
              id: singularName,
              crd: true,
            };
          });

        const models = _.flatten(data.filter(d => d.resources).map(defineModels));
        allResources.forEach(r => ADMIN_RESOURCES.has(r.split('/')[0]) ? adminResources.push(r) : safeResources.push(r));

        return {allResources, safeResources, adminResources, namespacedSet, models, preferredVersions};
      });
  });

export type APIResourceList = {
  kind: 'APIResourceList';
  apiVersion: 'v1';
  groupVersion: string;
  resources?: {
    name: string;
    singularName?: string;
    namespaced?: boolean;
    kind: string;
    verbs: string[];
  }[];
};
