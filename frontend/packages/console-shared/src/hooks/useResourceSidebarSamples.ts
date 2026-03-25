import { Map as ImmutableMap } from 'immutable';
import YAML from 'js-yaml';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { PodDisruptionBudgetModel } from '@console/app/src/models';
import type { AddAction, CatalogItemType, Perspective } from '@console/dynamic-plugin-sdk';
import { isAddAction, isCatalogItemType, isPerspective } from '@console/dynamic-plugin-sdk';
import type { FirehoseResult } from '@console/internal/components/utils/types';
import {
  BuildConfigModel,
  ClusterRoleModel,
  ConsoleLinkModel,
  ConsoleOperatorConfigModel,
  ResourceQuotaModel,
  RoleModel,
} from '@console/internal/models';
import type { GroupVersionKind, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { apiVersionForModel, referenceForModel } from '@console/internal/module/k8s';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { defaultCatalogCategories } from '../utils/default-categories';

export type Sample = {
  highlightText?: string;
  title: string;
  img?: string;
  description: string;
  id: string;
  yaml?: string;
  lazyYaml?: () => string;
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

const useClusterRoleBindingSamples = (): Sample[] => {
  const { t } = useTranslation('console-shared');

  return [
    {
      title: t('Allow reading Nodes in the core API groups (for ClusterRoleBinding)'),
      description: t(
        'This "ClusterRole" is allowed to read the resource "Nodes" in the core group (because a Node is cluster-scoped, this must be bound with a "ClusterRoleBinding" to be effective).',
      ),
      id: 'read-nodes',
      targetResource: getTargetResource(ClusterRoleModel),
    },
    {
      title: t(
        '"GET/POST" requests to non-resource endpoint and all subpaths (for ClusterRoleBinding)',
      ),
      description: t(
        'This "ClusterRole" is allowed to "GET" and "POST" requests to the non-resource endpoint "/healthz" and all subpaths (must be in the "ClusterRole" bound with a "ClusterRoleBinding" to be effective).',
      ),
      id: 'get-and-post-to-non-resource-endpoints',
      targetResource: getTargetResource(ClusterRoleModel),
    },
  ];
};

const useDefaultSamples = () => {
  const { t } = useTranslation('console-shared');
  const addActions = useExtensions<AddAction>(isAddAction);
  const catalogItemTypes = useExtensions<CatalogItemType>(isCatalogItemType);
  const perspectives = useExtensions<Perspective>(isPerspective);
  const clusterRoleBindingSamples = useClusterRoleBindingSamples();

  return ImmutableMap<GroupVersionKind, Sample[]>()
    .setIn(
      [referenceForModel(BuildConfigModel)],
      [
        {
          title: t('Build from Dockerfile'),
          description: t(
            'A Dockerfile build performs an image build using a Dockerfile in the source repository or specified in build configuration.',
          ),
          id: 'docker-build',
          targetResource: getTargetResource(BuildConfigModel),
        },
        {
          title: t('Source-to-Image (S2I) build'),
          description: t(
            'S2I is a tool for building reproducible container images. It produces ready-to-run images by injecting the application source into a container image and assembling a new image.',
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
          title: t('Set compute resource quota'),
          description: t(
            'Limit the total amount of memory and CPU that can be used in a namespace.',
          ),
          id: 'rq-compute',
          targetResource: getTargetResource(ResourceQuotaModel),
        },
        {
          title: t('Set maximum count for any resource'),
          description: t(
            'Restrict maximum count of each resource so users cannot create more than the allotted amount.',
          ),
          id: 'rq-counts',
          targetResource: getTargetResource(ResourceQuotaModel),
        },
        {
          title: t('Specify resource quotas for a given storage class'),
          description: t(
            'Limit the size and number of persistent volume claims that can be created with a storage class.',
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
          title: t('Allow reading the resource in API group'),
          description: t(
            'This "Role" is allowed to read the resource "Pods" in the core API group.',
          ),
          id: 'read-pods-within-ns',
          targetResource: getTargetResource(RoleModel),
        },
        {
          title: t('Allow reading/writing the resource in API group'),
          description: t(
            'This "Role" is allowed to read and write the "Deployments" in both the "extensions" and "apps" API groups.',
          ),
          id: 'read-write-deployment-in-ext-and-apps-apis',
          targetResource: getTargetResource(RoleModel),
        },
        {
          title: t('Allow different access rights to different types of resource and API groups'),
          description: t(
            'This "Role" is allowed to read "Pods" and read/write "Jobs" resources in API groups.',
          ),
          id: 'read-pods-and-read-write-jobs',
          targetResource: getTargetResource(RoleModel),
        },
        {
          title: t('Allow reading a ConfigMap in a specific namespace (for RoleBinding)'),
          description: t(
            'This "Role" is allowed to read a "ConfigMap" named "my-config" (must be bound with a "RoleBinding" to limit to a single "ConfigMap" in a single namespace).',
          ),
          id: 'read-configmap-within-ns',
          targetResource: getTargetResource(RoleModel),
        },
        ...clusterRoleBindingSamples,
      ],
    )
    .setIn([referenceForModel(ClusterRoleModel)], clusterRoleBindingSamples)
    .setIn(
      [referenceForModel(ConsoleLinkModel)],
      [
        {
          title: t('Add a link to the user menu'),
          description: t(
            'The user menu appears in the right side of the masthead below the username.',
          ),
          id: 'cl-user-menu',
          targetResource: getTargetResource(ConsoleLinkModel),
        },
        {
          title: t('Add a link to the application menu'),
          description: t(
            'The application menu appears in the masthead below the 9x9 grid icon. Application menu links can include an optional image and section heading.',
          ),
          id: 'cl-application-menu',
          targetResource: getTargetResource(ConsoleLinkModel),
        },
        {
          title: t('Add a link to the namespace dashboard'),
          description: t(
            'Namespace dashboard links appear on the project dashboard and namespace details pages in a section called "Launcher". Namespace dashboard links can optionally be restricted to a specific namespace or namespaces.',
          ),
          id: 'cl-namespace-dashboard',
          targetResource: getTargetResource(ConsoleLinkModel),
        },
        {
          title: t('Add a link to the contact mail'),
          description: t(
            'The contact mail link appears in the user menu below the username. The link will open the default email client with the email address filled in.',
          ),
          id: 'cl-contact-mail',
          targetResource: getTargetResource(ConsoleLinkModel),
        },
      ],
    )
    .setIn(
      [referenceForModel(ConsoleOperatorConfigModel)],
      [
        {
          title: t('Add catalog categories'),
          description: t(
            'Provides a list of default categories which are shown in the Software Catalog. The categories must be added below customization developerCatalog.',
          ),
          id: 'devcatalog-categories',
          snippet: true,
          lazyYaml: () => YAML.dump(defaultCatalogCategories),
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('Add project access roles'),
          description: t(
            'Provides a list of default roles which are shown in the Project Access. The roles must be added below customization projectAccess.',
          ),
          id: 'projectaccess-roles',
          snippet: true,
          lazyYaml: () => YAML.dump(defaultProjectAccessRoles),
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('Add page actions'),
          description: t(
            'Provides a list of all available actions on the Add page in the Developer perspective. The IDs must be added below customization addPage disabledActions to hide these actions.',
          ),
          id: 'addpage-actions',
          snippet: true,
          lazyYaml: () => {
            const sortedExtensions = addActions
              .slice()
              .sort((a, b) => a.properties.id.localeCompare(b.properties.id));
            const yaml = sortedExtensions
              .map((extension) => {
                const { id, label, description } = extension.properties;
                const labelComment = label.split('\n').join('\n  # ');
                const descriptionComment = description.split('\n').join('\n  # ');
                return `- # ${labelComment}\n  # ${descriptionComment}\n  ${id}`;
              })
              .join('\n');
            return yaml;
          },
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('Add sub-catalog types'),
          description: t(
            'Provides a list of all the available sub-catalog types which are shown in the Software Catalog. The types must be added below spec customization developerCatalog',
          ),
          id: 'devcatalog-types',
          snippet: true,
          lazyYaml: () => {
            const enabledTypes = {
              state: 'Enabled',
              enabled: catalogItemTypes.map((extension) => extension.properties.type),
            };
            return YAML.dump(enabledTypes);
          },
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('Add user perspectives'),
          description: t(
            'Provides a list of all the available user perspectives which are shown in the perspective dropdown. The perspectives must be added below spec customization.',
          ),
          id: 'user-perspectives',
          snippet: true,
          lazyYaml: () => {
            const yaml = perspectives.map((extension) => {
              const { id } = extension.properties;
              return {
                id,
                visibility: {
                  state: 'Enabled',
                },
              };
            });
            return YAML.dump(yaml);
          },
          targetResource: getTargetResource(ConsoleOperatorConfigModel),
        },
        {
          title: t('Add pinned resources'),
          description: t(
            'Provides a list of resources to be pinned on the Developer perspective navigation. The pinned resources must be added below spec customization perspectives.',
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
          title: t('Set maxUnavailable to 0'),
          description: t(
            'An eviction is allowed if at most 0 pods selected by "selector" are unavailable after the eviction.',
          ),
          id: 'pdb-max-unavailable',
          targetResource: getTargetResource(PodDisruptionBudgetModel),
        },
        {
          title: t('Set minAvailable to 25%'),
          description: t(
            'An eviction is allowed if at least 25% of pods selected by "selector" will still be available after the eviction.',
          ),
          id: 'pdb-min-available',
          targetResource: getTargetResource(PodDisruptionBudgetModel),
        },
      ],
    );
};

export const useResourceSidebarSamples = (kindObj: K8sKind, yamlSamplesList: FirehoseResult) => {
  const defaultSamples = useDefaultSamples();

  if (!kindObj) {
    return { snippets: [], samples: [] };
  }

  const yamlSamplesData = !_.isEmpty(yamlSamplesList)
    ? _.filter(
        yamlSamplesList.data,
        (sample: K8sResourceKind) =>
          sample.spec.targetResource.apiVersion === apiVersionForModel(kindObj) &&
          sample.spec.targetResource.kind === kindObj.kind,
      )
    : [];

  const existingSamples = defaultSamples.get(referenceForModel(kindObj)) || [];
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
