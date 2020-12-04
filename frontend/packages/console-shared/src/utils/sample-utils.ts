import { Map as ImmutableMap } from 'immutable';
import {
  BuildConfigModel,
  ClusterRoleModel,
  ConsoleLinkModel,
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

import * as denyOtherNamespacesImg from '@console/internal/imgs/network-policy-samples/1-deny-other-namespaces.svg';
import * as limitCertainAppImg from '@console/internal/imgs/network-policy-samples/2-limit-certain-apps.svg';
import * as allowIngressImg from '@console/internal/imgs/network-policy-samples/3-allow-ingress.svg';
import * as defaultDenyAllImg from '@console/internal/imgs/network-policy-samples/4-default-deny-all.svg';
import * as webAllowExternalImg from '@console/internal/imgs/network-policy-samples/5-web-allow-external.svg';
import * as webDbAllowAllNsImg from '@console/internal/imgs/network-policy-samples/6-web-db-allow-all-ns.svg';
import * as webAllowProductionImg from '@console/internal/imgs/network-policy-samples/7-web-allow-production.svg';
import { FirehoseResult } from '@console/internal/components/utils';
import * as _ from 'lodash';

export type Sample = {
  highlightText?: string;
  title: string;
  img?: string;
  description: string;
  id: string;
  yaml?: string;
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

const clusterRoleBindingSamples: Sample[] = [
  {
    title: 'Allow reading Nodes in the core API groups (for ClusterRoleBinding)',
    description:
      'This "ClusterRole" is allowed to read the resource "nodes" in the core group (because a Node is cluster-scoped, this must be bound with a "ClusterRoleBinding" to be effective).',
    id: 'read-nodes',
    targetResource: getTargetResource(ClusterRoleModel),
  },
  {
    title: '"GET/POST" requests to non-resource endpoint and all subpaths (for ClusterRoleBinding)',
    description:
      'This "ClusterRole" is allowed to "GET" and "POST" requests to the non-resource endpoint "/healthz" and all subpaths (must be in the "ClusterRole" bound with a "ClusterRoleBinding" to be effective).',
    id: 'get-and-post-to-non-resource-endpoints',
    targetResource: getTargetResource(ClusterRoleModel),
  },
];

const defaultSamples = ImmutableMap<GroupVersionKind, Sample[]>()
  .setIn(
    [referenceForModel(BuildConfigModel)],
    [
      {
        title: 'Build from Dockerfile',
        description:
          'A Dockerfile build performs an image build using a Dockerfile in the source repository or specified in build configuration.',
        id: 'docker-build',
        targetResource: getTargetResource(BuildConfigModel),
      },
      {
        title: 'Build from Devfile',
        description:
          'A Devfile build performs an image build using a devfile in the source repository or specified in build configuration.',
        id: 'devfile-build',
        targetResource: getTargetResource(BuildConfigModel),
      },
      {
        title: 'Source-to-Image (S2I) build',
        description:
          'S2I is a tool for building reproducible container images. It produces ready-to-run images by injecting the application source into a container image and assembling a new image.',
        id: 's2i-build',
        targetResource: getTargetResource(BuildConfigModel),
      },
    ],
  )
  .setIn(
    [referenceForModel(NetworkPolicyModel)],
    [
      {
        highlightText: 'Limit',
        title: 'access to the current namespace',
        img: denyOtherNamespacesImg,
        description:
          'Deny traffic from other namespaces while allowing all traffic from the namespaces the Pod is living in.',
        id: 'deny-other-namespaces',
        targetResource: getTargetResource(NetworkPolicyModel),
      },
      {
        highlightText: 'Limit',
        title: 'traffic to an application within the same namespace',
        img: limitCertainAppImg,
        description:
          'Allow inbound traffic from only certain Pods. One typical use case is to restrict the connections to a database only to the specific applications.',
        id: 'db-or-api-allow-app',
        targetResource: getTargetResource(NetworkPolicyModel),
      },
      {
        highlightText: 'Allow',
        title: 'http and https ingress within the same namespace',
        img: allowIngressImg,
        description:
          'Define ingress rules for specific port numbers of an application. The rule applies to all port numbers if not specified.',
        id: 'api-allow-http-and-https',
        targetResource: getTargetResource(NetworkPolicyModel),
      },
      {
        highlightText: 'Deny',
        title: 'all non-whitelisted traffic in the current namespace',
        img: defaultDenyAllImg,
        description:
          'A fundamental policy by blocking all cross-pod traffics expect whitelisted ones through the other Network Policies being deployed.',
        id: 'default-deny-all',
        targetResource: getTargetResource(NetworkPolicyModel),
      },
      {
        highlightText: 'Allow',
        title: 'traffic from external clients',
        img: webAllowExternalImg,
        description:
          'Allow external service from public Internet directly or through a Load Balancer to access the pod.',
        id: 'web-allow-external',
        targetResource: getTargetResource(NetworkPolicyModel),
      },
      {
        highlightText: 'Allow',
        title: 'traffic to an application from all namespaces',
        img: webDbAllowAllNsImg,
        description:
          'One typical use case is for a common database which is used by deployments in different namespaces.',
        id: 'web-db-allow-all-ns',
        targetResource: getTargetResource(NetworkPolicyModel),
      },
      {
        highlightText: 'Allow',
        title: 'traffic from all pods in a particular namespace',
        img: webAllowProductionImg,
        description:
          'Typical use case should be "only allow deployments in production namespaces to access the database" or "allow monitoring tools (in another namespace) to scrape metrics from current namespace."',
        id: 'web-allow-production',
        targetResource: getTargetResource(NetworkPolicyModel),
      },
    ],
  )
  .setIn(
    [referenceForModel(ResourceQuotaModel)],
    [
      {
        title: 'Set compute resource quota',
        description: 'Limit the total amount of memory and CPU that can be used in a namespace.',
        id: 'rq-compute',
        targetResource: getTargetResource(ResourceQuotaModel),
      },
      {
        title: 'Set maximum count for any resource',
        description:
          'Restrict maximum count of each resource so users cannot create more than the allotted amount.',
        id: 'rq-counts',
        targetResource: getTargetResource(ResourceQuotaModel),
      },
      {
        title: 'Specify resource quotas for a given storage class',
        description:
          'Limit the size and number of persistent volume claims that can be created with a storage class.',
        id: 'rq-storageclass',
        targetResource: getTargetResource(ResourceQuotaModel),
      },
    ],
  )
  .setIn(
    [referenceForModel(RoleModel)],
    [
      {
        title: 'Allow reading the resource in API group',
        description: 'This "Role" is allowed to read the resource "Pods" in the core API group.',
        id: 'read-pods-within-ns',
        targetResource: getTargetResource(RoleModel),
      },
      {
        title: 'Allow reading/writing the resource in API group',
        description:
          'This "Role" is allowed to read and write the "Deployments" in both the "extensions" and "apps" API groups.',
        id: 'read-write-deployment-in-ext-and-apps-apis',
        targetResource: getTargetResource(RoleModel),
      },
      {
        title: 'Allow different access rights to different types of resource and API groups',
        description:
          'This "Role" is allowed to read "Pods" and read/write "Jobs" resources in API groups.',
        id: 'read-pods-and-read-write-jobs',
        targetResource: getTargetResource(RoleModel),
      },
      {
        title: 'Allow reading a ConfigMap in a specific namespace (for RoleBinding)',
        description:
          'This "Role" is allowed to read a "ConfigMap" named "my-config" (must be bound with a "RoleBinding" to limit to a single "ConfigMap" in a single namespace).',
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
        title: 'Add a link to the user menu',
        description: 'The user menu appears in the right side of the masthead below the username.',
        id: 'cl-user-menu',
        targetResource: getTargetResource(ConsoleLinkModel),
      },
      {
        title: 'Add a link to the application menu',
        description:
          'The application menu appears in the masthead below the 9x9 grid icon.  Application menu links can include an optional image and section heading.',
        id: 'cl-application-menu',
        targetResource: getTargetResource(ConsoleLinkModel),
      },
      {
        title: 'Add a link to the namespace dashboard',
        description:
          'Namespace dashboard links appear on the project dashboard and namespace details pages in a section called "Launcher".  Namespace dashboard links can optionally be restricted to a specific namespace or namespaces.',
        id: 'cl-namespace-dashboard',
        targetResource: getTargetResource(ConsoleLinkModel),
      },
    ],
  );

export const getResourceSidebarSamples = (kindObj: K8sKind, yamlSamplesList: FirehoseResult) => {
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
