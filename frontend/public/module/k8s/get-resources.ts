import * as _ from 'lodash-es';
import { plural } from 'pluralize';
import i18next, { TFunction } from 'i18next';

import { K8sKind, K8sVerb } from '../../module/k8s';
import { isModelMetadata, ModelMetadata } from '@console/dynamic-plugin-sdk';
import { DiscoveryResources } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import {
  getTranslationKey,
  isTranslatableString,
  translateExtension,
} from '@console/plugin-sdk/src/utils/extension-i18n';
import { API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY } from '@console/shared/src/constants';
import { fetchURL } from '../../graphql/client';
import { pluginStore } from '../../plugins';
import { loading as i18nLoading } from '../../i18n';

const ADMIN_RESOURCES = new Set([
  'roles',
  'rolebindings',
  'clusterroles',
  'clusterrolebindings',
  'thirdpartyresources',
  'nodes',
  'secrets',
]);

const abbrBlacklist = ['ASS', 'FART'];
export const kindToAbbr = (kind) => {
  const abbrKind = (kind.replace(/[^A-Z]/g, '') || kind.toUpperCase()).slice(0, 4);
  return abbrBlacklist.includes(abbrKind) ? abbrKind.slice(0, -1) : abbrKind;
};

export const cacheResources = (resources) =>
  new Promise<void>((resolve, reject) => {
    try {
      // Add the console version. We invalidate the cache when console version changes.
      const { consoleVersion } = window.SERVER_FLAGS;
      const versionedResources = _.assign({}, resources, { consoleVersion });
      localStorage.setItem(
        API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY,
        JSON.stringify(versionedResources),
      );
      resolve();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error caching API resources in localStorage', e);
      reject(e);
    }
  });

export const getCachedResources = () =>
  new Promise<any>((resolve, reject) => {
    try {
      const resourcesJSON = localStorage.getItem(API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);

      // Clear cached resources after load as a safeguard. If there's any errors
      // with the content that prevents the console from working, the bad data
      // will not be loaded when the user refreshes the console. The cache will
      // be refreshed when discovery completes.
      localStorage.removeItem(API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY);

      if (resourcesJSON) {
        const resources = JSON.parse(resourcesJSON);
        const { consoleVersion: currentVersion } = window.SERVER_FLAGS;
        const { consoleVersion: cachedVersion } = resources;
        if (cachedVersion !== currentVersion) {
          // eslint-disable-next-line no-console
          console.log(
            `Invalidating API discovery cache from earlier console version (current: ${currentVersion}, cached: ${cachedVersion})`,
          );
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

export const pluralizeKind = (kind: string): string => {
  // Use startCase to separate words so the last can be pluralized but remove spaces so as not to humanize
  const pluralized = plural(_.startCase(kind)).replace(/\s+/g, '');
  // Handle special cases like DB -> DBs (instead of DBS).
  if (pluralized === `${kind}S`) {
    return `${kind}s`;
  }
  return pluralized;
};

export const getModelExtensionMetadata = (
  extensions: LoadedExtension<ModelMetadata>[],
  group: string,
  version?: string,
  kind?: string,
) => {
  const tcb: TFunction = (value: string) =>
    isTranslatableString(value) ? i18next.t(getTranslationKey(value)) : value;
  const translatedExtensions = extensions.map((e) => translateExtension(e, tcb));
  const groupVersionKindMetadata = translatedExtensions
    .filter(
      ({ properties }) =>
        properties.model.group === group &&
        properties.model.kind === kind &&
        properties.model.version === version,
    )
    .map((e) => e.properties);
  const groupKindMetadata = translatedExtensions
    .filter(
      ({ properties }) =>
        properties.model.version == null &&
        properties.model.group === group &&
        properties.model.kind === kind,
    )
    .map((e) => e.properties);
  const groupMetadata = translatedExtensions
    .filter(
      ({ properties }) =>
        properties.model.kind == null &&
        properties.model.version == null &&
        properties.model.group === group,
    )
    .map((e) => e.properties);

  return _.omit(
    Object.assign({}, ...groupMetadata, ...groupKindMetadata, ...groupVersionKindMetadata),
    ['model'],
  );
};

export const getResources = (): Promise<DiscoveryResources> =>
  fetchURL('/apis').then((res) => {
    const groupVersionMap = res.groups.reduce(
      (acc, { name, versions, preferredVersion: { version } }) => {
        acc[name] = {
          versions: _.map(versions, 'version'),
          preferredVersion: version,
        };
        return acc;
      },
      {},
    );
    const all = _.flatten<string>(
      res.groups.map((group) => group.versions.map((version) => `/apis/${version.groupVersion}`)),
    )
      .concat(['/api/v1'])
      .map((p) => fetchURL<APIResourceList>(p).catch((err) => err));

    // Wait also until the known translation bundles are resolved
    all.push(i18nLoading);

    return Promise.all(all).then((data) => {
      // Drop i18nLoading promise (resolved loaded state)
      data.pop();

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

      const defineModels = (list: APIResourceList): K8sKind[] => {
        const metadataExtensions = pluginStore
          .getExtensionsInUse()
          .filter(isModelMetadata) as LoadedExtension<ModelMetadata>[];
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
              ...getModelExtensionMetadata(metadataExtensions, apiGroup, apiVersion, kind),
            };
          });
      };

      const models = _.flatten(data.filter((d) => d.resources).map(defineModels));
      allResources.forEach((r) =>
        ADMIN_RESOURCES.has(r.split('/')[0]) ? adminResources.push(r) : safeResources.push(r),
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
      };
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
    verbs: K8sVerb[];
    shortNames?: string[];
  }[];
};
