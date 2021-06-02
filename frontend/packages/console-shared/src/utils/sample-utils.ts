import { TFunction } from 'i18next';
import { Map as ImmutableMap } from 'immutable';
import YAML from 'js-yaml';
import * as _ from 'lodash';
import { defaultCatalogCategories } from '@console/dev-console/src/components/catalog/utils/default-categories';
import { defaultProjectAccessRoles } from '@console/dev-console/src/components/project-access/project-access-form-utils';
import { AddAction, isAddAction } from '@console/dynamic-plugin-sdk';
import { FirehoseResult } from '@console/internal/components/utils';
import * as denyOtherNamespacesImg from '@console/internal/imgs/network-policy-samples/1-deny-other-namespaces.svg';
import * as limitCertainAppImg from '@console/internal/imgs/network-policy-samples/2-limit-certain-apps.svg';
import * as allowIngressImg from '@console/internal/imgs/network-policy-samples/3-allow-ingress.svg';
import * as defaultDenyAllImg from '@console/internal/imgs/network-policy-samples/4-default-deny-all.svg';
import * as webAllowExternalImg from '@console/internal/imgs/network-policy-samples/5-web-allow-external.svg';
import * as webDbAllowAllNsImg from '@console/internal/imgs/network-policy-samples/6-web-db-allow-all-ns.svg';
import * as webAllowProductionImg from '@console/internal/imgs/network-policy-samples/7-web-allow-production.svg';
import {
  BuildConfigModel,
  ClusterRoleModel,
  ConsoleLinkModel,
  ConsoleOperatorConfigModel,
  NetworkPolicyModel,
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
import { subscribeToExtensions } from '@console/plugin-sdk/src/api/subscribeToExtensions';

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

const getTargetResource = (model: K8sKind) => ({
  apiVersion: apiVersionForModel(model),
  kind: model.kind,
});

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
      [referenceForModel(NetworkPolicyModel)],
      [
        {
          highlightText: t('console-shared~Limit'),
          title: t('console-shared~access to the current namespace'),
          img: denyOtherNamespacesImg,
          description: t(
            'console-shared~Deny traffic from other namespaces while allowing all traffic from the namespaces the Pod is living in.',
          ),
          id: 'deny-other-namespaces',
          targetResource: getTargetResource(NetworkPolicyModel),
        },
        {
          highlightText: t('console-shared~Limit'),
          title: t('console-shared~traffic to an application within the same namespace'),
          img: limitCertainAppImg,
          description: t(
            'console-shared~Allow inbound traffic from only certain Pods. One typical use case is to restrict the connections to a database only to the specific applications.',
          ),
          id: 'db-or-api-allow-app',
          targetResource: getTargetResource(NetworkPolicyModel),
        },
        {
          highlightText: t('console-shared~Allow'),
          title: t('console-shared~http and https ingress within the same namespace'),
          img: allowIngressImg,
          description: t(
            'console-shared~Define ingress rules for specific port numbers of an application. The rule applies to all port numbers if not specified.',
          ),
          id: 'api-allow-http-and-https',
          targetResource: getTargetResource(NetworkPolicyModel),
        },
        {
          highlightText: t('console-shared~Deny'),
          title: t('console-shared~all non-whitelisted traffic in the current namespace'),
          img: defaultDenyAllImg,
          description: t(
            'console-shared~A fundamental policy by blocking all cross-pod traffics expect whitelisted ones through the other Network Policies being deployed.',
          ),
          id: 'default-deny-all',
          targetResource: getTargetResource(NetworkPolicyModel),
        },
        {
          highlightText: t('console-shared~Allow'),
          title: t('console-shared~traffic from external clients'),
          img: webAllowExternalImg,
          description: t(
            'console-shared~Allow external service from public Internet directly or through a Load Balancer to access the Pod.',
          ),
          id: 'web-allow-external',
          targetResource: getTargetResource(NetworkPolicyModel),
        },
        {
          highlightText: t('console-shared~Allow'),
          title: t('console-shared~traffic to an application from all namespaces'),
          img: webDbAllowAllNsImg,
          description: t(
            'console-shared~One typical use case is for a common database which is used by deployments in different namespaces.',
          ),
          id: 'web-db-allow-all-ns',
          targetResource: getTargetResource(NetworkPolicyModel),
        },
        {
          highlightText: t('console-shared~Allow'),
          title: t('console-shared~traffic from all Pods in a particular namespace'),
          img: webAllowProductionImg,
          description: t(
            'console-shared~Typical use case should be "only allow deployments in production namespaces to access the database" or "allow monitoring tools (in another namespace) to scrape metrics from current namespace."',
          ),
          id: 'web-allow-production',
          targetResource: getTargetResource(NetworkPolicyModel),
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
            'console-shared~Provides a list of default categories which are shown in the Developer Catalog. The categories must be added below customization developerCatalog.',
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
                      const labelComment = translateExtension(label)
                        .split('\n')
                        .join('\n  # ');
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
          ...sample.spec,
        };
      })
    : [];

  const allSamples = [...existingSamples, ...extensionSamples];

  // For the time being, `snippets` are a superset of `samples`
  const snippets = allSamples.filter((sample: Sample) => sample.snippet);
  const samples = allSamples.filter((sample: Sample) => !sample.snippet);

  return { snippets, samples };
};
