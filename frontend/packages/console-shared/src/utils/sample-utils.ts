import { TFunction } from 'i18next';
import { Map as ImmutableMap } from 'immutable';
import YAML from 'js-yaml';
import * as _ from 'lodash';
import { PodDisruptionBudgetModel } from '@console/app/src/models';
import {
  AddAction,
  isAddAction,
  CatalogItemType,
  isCatalogItemType,
  isPerspective,
  Perspective,
} from '@console/dynamic-plugin-sdk';
import { FirehoseResult } from '@console/internal/components/utils';
import {
  BuildConfigModel,
  ClusterRoleModel,
  ConsoleLinkModel,
  ConsoleOperatorConfigModel,
  ResourceQuotaModel,
  RoleModel,
} from '@console/internal/models';
import {
  apiVersionForModel,
  GroupVersionKind,
  K8sKind,
  K8sResourceKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { LoadedExtension } from '@console/plugin-sdk/src';
import { subscribeToExtensions } from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import { defaultCatalogCategories } from './default-categories';

export type Sample = {
  highlightText?: string;
  title: string;
  img?: string;
  description: string;
  id: string;
  yaml?: string;
  lazyYaml?: () => Promise<string>;
  snippet?: boolean;
  targetResource: {
    apiVersion: string;
    kind: string;
  };
};

type ProjectAccessRoles = {
  availableClusterRoles: string[];
};

const getTargetResource = (model: K8sKind) => ({
  apiVersion: apiVersionForModel(model),
  kind: model.kind,
});

const defaultProjectAccessRoles: ProjectAccessRoles = {
  availableClusterRoles: ['admin', 'edit', 'view'],
};

const samplePinnedResources = [
  { group: 'apps', version: 'v1', resource: 'deployments' },
  { group: '', version: 'v1', resource: 'secrets' },
  { group: '', version: 'v1', resource: 'configmaps' },
  { group: '', version: 'v1', resource: 'pods' },
];

const clusterRoleBindingSamples = (t: TFunction): Sample[] => [
  {
    title: t('console-shared~Allow reading Nodes in the core API groups (for ClusterRoleBinding)'),
    description: t(
      'console-shared~This "ClusterRole" is allowed to read the resource "Nodes" in the core group (because a Node is cluster-scoped, this must be bound with a "ClusterRoleBinding" to be effective).',
    ),
    id: 'read-nodes',
    targetResource: getTargetResource(ClusterRoleModel),
  },
  {
    title: t(
      'console-shared~"GET/POST" requests to non-resource endpoint and all subpaths (for ClusterRoleBinding)',
    ),
    description: t(
      'console-shared~This "ClusterRole" is allowed to "GET" and "POST" requests to the non-resource endpoint "/healthz" and all subpaths (must be in the "ClusterRole" bound with a "ClusterRoleBinding" to be effective).',
    ),
    id: 'get-and-post-to-non-resource-endpoints',
    targetResource: getTargetResource(ClusterRoleModel),
  },
];

const defaultSamples = (t: TFunction) =>
  ImmutableMap<GroupVersionKind, Sample[]>()
    .setIn(
      [referenceForModel(BuildConfigModel)],
      [
        {
          title: t('console-shared~Build from Dockerfile'),
          description: t(
            'console-shared~A Dockerfile build performs an image build using a Dockerfile in the source repository or specified in build configuration.',
          ),
          id: 'docker-build',
          targetResource: getTargetResource(BuildConfigModel),
        },
        {
          title: t('console-shared~Source-to-Image (S2I) build'),
          description: t(
            'console-shared~S2I is a tool for building reproducible container images. It produces ready-to-run images by injecting the application source into a container image and assembling a new image.',
          ),
          id: 's2i-build',
          targetResource: getTargetResource(BuildConfigModel),
        },
      ],
    )
    .setIn(
      [referenceForModel(ResourceQuotaModel)],
      [
        {
          title: t('console-shared~Set compute resource quota'),
          description: t(
            'console-shared~Limit the total amount of memory and CPU that can be used in a namespace.',
          ),
          id: 'rq-compute',
          targetResource: getTargetResource(ResourceQuotaModel),
        },
        {
          title: t('console-shared~Set maximum count for any resource'),
          description: t(
            'console-shared~Restrict maximum count of each resource so users cannot create more than the allotted amount.',
          ),
          id: 'rq-counts',
          targetResource: getTargetResource(ResourceQuotaModel),
        },
        {
          title: t('console-shared~Specify resource quotas for a given storage class'),
          description: t(
            'console-shared~Limit the size and number of persistent volume claims that can be created with a storage class.',
          ),
          id: 'rq-storageclass',
          targetResource: getTargetResource(ResourceQuotaModel),
        },
      ],
    )
    .setIn(
      [referenceForModel(RoleModel)],
      [
        {
          title: t('console-shared~Allow reading the resource in API group'),
          description: t(
            'console-shared~This "Role" is allowed to read the resource "Pods" in the core API group.',
          ),
          id: 'read-pods-within-ns',
          targetResource: getTargetResource(RoleModel),
        },
        {
          title: t('console-shared~Allow reading/writing the resource in API group'),
          description: t(
            'console-shared~This "Role" is allowed to read and write the "Deployments" in both the "extensions" and "apps" API groups.',
          ),
          id: 'read-write-deployment-in-ext-and-apps-apis',
          targetResource: getTargetResource(RoleModel),
        },
        {
          title: t(
            'console-shared~Allow different access rights to different types of resource and API groups',
          ),
          description: t(
            'console-shared~This "Role" is allowed to read "Pods" and read/write "Jobs" resources in API groups.',
          ),
          id: 'read-pods-and-read-write-jobs',
          targetResource: getTargetResource(RoleModel),
        },
        {
          title: t(
            'console-shared~Allow reading a ConfigMap in a specific namespace (for RoleBinding)',
          ),
          description: t(
            'console-shared~This "Role" is allowed to read a "ConfigMap" named "my-config" (must be bound with a "RoleBinding" to limit to a single "ConfigMap" in a single namespace).',
          ),
          id: 'read-configmap-within-ns',
          targetResource: getTargetResource(RoleModel),
        },
        ...clusterRoleBindingSamples(t),
      ],
    )
    .setIn([referenceForModel(ClusterRoleModel)], clusterRoleBindingSamples(t))
    .setIn(
      [referenceForModel(ConsoleLinkModel)],
      [
        {
          title: t('console-shared~Add a link to the user menu'),
          description: t(
            'console-shared~The user menu appears in the right side of the masthead below the username.',
          ),
          id: 'cl-user-menu',
          targetResource: getTargetResource(ConsoleLinkModel),
        },
        {
          title: t('console-shared~Add a link to the application menu'),
          description: t(
            'console-shared~The application menu appears in the masthead below the 9x9 grid icon. Application menu links can include an optional image and section heading.',
          ),
          id: 'cl-application-menu',
          targetResource: getTargetResource(ConsoleLinkModel),
        },
        {
          title: t('console-shared~Add a link to the namespace dashboard'),
          description: t(
            'console-shared~Namespace dashboard links appear on the project dashboard and namespace details pages in a section called "Launcher". Namespace dashboard links can optionally be restricted to a specific namespace or namespaces.',
          ),
          id: 'cl-namespace-dashboard',
          targetResource: getTargetResource(ConsoleLinkModel),
        },
      ],
    )
    .setIn(
      [referenceForModel(ConsoleOperatorConfigModel)],
      [
        {
          title: t('console-shared~Add catalog categories'),
          description: t(
            'console-shared~Provides a list of default categories which are shown in the Software Catalog. The categories must be added below customization developerCatalog.',
          ),
          id: 'devcatalog-categories',
          snippet: true,
          lazyYaml: () => YAML.dump(defaultCatalogCategories),
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('console-shared~Add project access roles'),
          description: t(
            'console-shared~Provides a list of default roles which are shown in the Project Access. The roles must be added below customization projectAccess.',
          ),
          id: 'projectaccess-roles',
          snippet: true,
          lazyYaml: () => YAML.dump(defaultProjectAccessRoles),
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('console-shared~Add page actions'),
          description: t(
            'console-shared~Provides a list of all available actions on the Add page in the Developer perspective. The IDs must be added below customization addPage disabledActions to hide these actions.',
          ),
          id: 'addpage-actions',
          snippet: true,
          lazyYaml: () => {
            // Similar to useTranslationExt
            const translateExtension = (key: string) => {
              if (key.length < 3 || key[0] !== '%' || key[key.length - 1] !== '%') {
                return key;
              }
              return t(key.substr(1, key.length - 2));
            };
            return new Promise<string>((resolve) => {
              // Using subscribeToExtensions here instead of useExtensions hook because
              // this lazyYaml method is not called in a render flow.
              // We should probably have a yaml snippets extension later for this.
              const unsubscribe = subscribeToExtensions<AddAction>(
                (extensions: LoadedExtension<AddAction>[]) => {
                  const sortedExtensions = extensions
                    .slice()
                    .sort((a, b) => a.properties.id.localeCompare(b.properties.id));
                  const yaml = sortedExtensions
                    .map((extension) => {
                      const { id, label, description } = extension.properties;
                      const labelComment = translateExtension(label).split('\n').join('\n  # ');
                      const descriptionComment = translateExtension(description)
                        .split('\n')
                        .join('\n  # ');
                      return `- # ${labelComment}\n  # ${descriptionComment}\n  ${id}`;
                    })
                    .join('\n');
                  resolve(yaml);
                  unsubscribe();
                },
                isAddAction,
              );
            });
          },
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('console-shared~Add sub-catalog types'),
          description: t(
            'console-shared~Provides a list of all the available sub-catalog types which are shown in the Software Catalog. The types must be added below spec customization developerCatalog',
          ),
          id: 'devcatalog-types',
          snippet: true,
          lazyYaml: () => {
            return new Promise<string>((resolve) => {
              const unsubscribe = subscribeToExtensions<CatalogItemType>(
                (extensions: LoadedExtension<CatalogItemType>[]) => {
                  const enabledTypes = {
                    state: 'Enabled',
                    enabled: extensions.map((extension) => extension.properties.type),
                  };
                  resolve(YAML.dump(enabledTypes));
                  unsubscribe();
                },
                isCatalogItemType,
              );
            });
          },
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('console-shared~Add user perspectives'),
          description: t(
            'console-shared~Provides a list of all the available user perspectives which are shown in the perspective dropdown. The perspectives must be added below spec customization.',
          ),
          id: 'user-perspectives',
          snippet: true,
          lazyYaml: () => {
            return new Promise<string>((resolve) => {
              const unsubscribe = subscribeToExtensions<Perspective>(
                (extensions: LoadedExtension<Perspective>[]) => {
                  const yaml = extensions.map((extension) => {
                    const { id } = extension.properties;
                    return {
                      id,
                      visibility: {
                        state: 'Enabled',
                      },
                    };
                  });
                  resolve(YAML.dump(yaml));
                  unsubscribe();
                },
                isPerspective,
              );
            });
          },
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('console-shared~Add pinned resources'),
          description: t(
            'console-shared~Provides a list of resources to be pinned on the Developer perspective navigation. The pinned resources must be added below spec customization perspectives.',
          ),
          id: 'dev-pinned-resources',
          snippet: true,
          lazyYaml: () => YAML.dump(samplePinnedResources),
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
      ],
    )
    .setIn(
      [referenceForModel(PodDisruptionBudgetModel)],
      [
        {
          title: t('console-shared~Set maxUnavaliable to 0'),
          description: t(
            'console-shared~An eviction is allowed if at most 0 pods selected by "selector" are unavailable after the eviction.',
          ),
          id: 'pdb-max-unavailable',
          targetResource: getTargetResource(PodDisruptionBudgetModel),
        },
        {
          title: t('console-shared~Set minAvailable to 25%'),
          description: t(
            'console-shared~An eviction is allowed if at least 25% of pods selected by "selector" will still be available after the eviction.',
          ),
          id: 'pdb-min-available',
          targetResource: getTargetResource(PodDisruptionBudgetModel),
        },
      ],
    );

export const getResourceSidebarSamples = (
  kindObj: K8sKind,
  yamlSamplesList: FirehoseResult,
  t: TFunction,
) => {
  const yamlSamplesData = !_.isEmpty(yamlSamplesList)
    ? _.filter(
        yamlSamplesList.data,
        (sample: K8sResourceKind) =>
          sample.spec.targetResource.apiVersion === apiVersionForModel(kindObj) &&
          sample.spec.targetResource.kind === kindObj.kind,
      )
    : [];
  const existingSamples = defaultSamples(t).get(referenceForModel(kindObj)) || [];
  const extensionSamples = !_.isEmpty(yamlSamplesData)
    ? yamlSamplesData.map((sample: K8sResourceKind) => {
        return {
          id: sample.metadata.uid,
          ...(sample.spec as Exclude<Sample, 'id'>),
        };
      })
    : [];

  const allSamples = [...existingSamples, ...extensionSamples];

  // For the time being, `snippets` are a superset of `samples`
  const snippets = allSamples.filter((sample: Sample) => sample.snippet);
  const samples = allSamples.filter((sample: Sample) => !sample.snippet);

  return { snippets, samples };
};
