import * as _ from 'lodash-es';
import * as React from 'react';

import { RoleModel, ClusterRoleModel } from '../../models';
import { referenceForModel } from '../../module/k8s';
import { SampleYaml } from './resource-sidebar';

const samples = [
  {
    header: 'Allow reading the resource in API group',
    details: 'This "Role" is allowed to read the resource "Pods" in the core API group.',
    templateName: 'read-pods-within-ns',
    kind: referenceForModel(RoleModel),
  },
  {
    header: 'Allow reading/writing the resource in API group',
    details: 'This "Role" is allowed to read and write the "Deployments" in both the "extensions" and "apps" API groups.',
    templateName: 'read-write-deployment-in-ext-and-apps-apis',
    kind: referenceForModel(RoleModel),
  },
  {
    header: 'Allow different access rights to different types of resource and API groups',
    details: 'This "Role" is allowed to read "Pods" and read/write "Jobs" resources in API groups.',
    templateName: 'read-pods-and-read-write-jobs',
    kind: referenceForModel(RoleModel),
  },
  {
    header: 'Allow reading a ConfigMap in a specific namespace',
    subheader: '(for RoleBinding)',
    details: 'This "Role" is allowed to read a "ConfigMap" named "my-config" (must be bound with a "RoleBinding" to limit to a single "ConfigMap" in a single namespace).',
    templateName: 'read-configmap-within-ns',
    kind: referenceForModel(RoleModel),
  },
  {
    header: 'Allow reading Nodes in the core API groups',
    subheader: '(for ClusterRoleBinding)',
    details: 'This "ClusterRole" is allowed to read the resource "nodes" in the core group (because a Node is cluster-scoped, this must be bound with a "ClusterRoleBinding" to be effective).',
    templateName: 'read-nodes',
    kind: referenceForModel(ClusterRoleModel),
  },
  {
    header: '"GET/POST" requests to non-resource endpoint and all subpaths',
    subheader: '(for ClusterRoleBinding)',
    details: 'This "ClusterRole" is allowed to "GET" and "POST" requests to the non-resource endpoint "/healthz" and all subpaths (must be in the "ClusterRole" bound with a "ClusterRoleBinding" to be effective).',
    templateName: 'get-and-post-to-non-resource-endpoints',
    kind: referenceForModel(ClusterRoleModel),
  },
];

export const RoleSidebar = ({kindObj, loadSampleYaml, downloadSampleYaml, isCreateMode}) => {
  const filteredSamples = isCreateMode ? samples : _.filter(samples, {'kind' : referenceForModel(kindObj)});
  return <ol className="co-resource-sidebar-list">
    {_.map(filteredSamples, (sample) => <SampleYaml
      key={sample.templateName}
      sample={sample}
      loadSampleYaml={loadSampleYaml}
      downloadSampleYaml={downloadSampleYaml} />)}
  </ol>;
};
