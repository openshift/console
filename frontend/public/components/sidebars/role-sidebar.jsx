import * as _ from 'lodash-es';
import * as React from 'react';
import { registerTemplate } from '../../yaml-templates';

registerTemplate('rbac.authorization.k8s.io/v1.Role', `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-pods-within-ns
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
`, 'read-pods-within-ns');

registerTemplate('rbac.authorization.k8s.io/v1.Role', `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-write-deployment-in-ext-and-apps-apis
  namespace: default
rules:
- apiGroups: ["extensions", "apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
`, 'read-write-deployment-in-ext-and-apps-apis');

registerTemplate('rbac.authorization.k8s.io/v1.Role', `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-pods-and-read-write-jobs
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["batch", "extensions"]
  resources: ["jobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
`, 'read-pods-and-read-write-jobs');

registerTemplate('rbac.authorization.k8s.io/v1.Role', `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-configmap-within-ns
  namespace: default
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["my-config"]
  verbs: ["get"]
`, 'read-configmap-within-ns');

registerTemplate('rbac.authorization.k8s.io/v1.ClusterRole', `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: read-nodes
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
`, 'read-nodes');

registerTemplate('rbac.authorization.k8s.io/v1.ClusterRole', `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: get-and-post-to-non-resource-endpoints
rules:
- nonResourceURLs: ["/healthz", "/healthz/*"] # '*' in a nonResourceURL is a suffix glob match
  verbs: ["get", "post"]
`, 'get-and-post-to-non-resource-endpoints');

const samples = [
  {
    header: 'Allow reading the resource in API group',
    details: 'This "Role" is allowed to read the resource "Pods" in the core API group.',
    templateName: 'read-pods-within-ns',
    kind: 'Role',
  },
  {
    header: 'Allow reading/writing the resource in API group',
    details: 'This "Role" is allowed to read and write the "Deployments" in both the "extensions" and "apps" API groups.',
    templateName: 'read-write-deployment-in-ext-and-apps-apis',
    kind: 'Role',
  },
  {
    header: 'Allow different access rights to different types of resource and API groups',
    details: 'This "Role" is allowed to read "Pods" and read/write "Jobs" resources in API groups.',
    templateName: 'read-pods-and-read-write-jobs',
    kind: 'Role',
  },
  {
    header: 'Allow reading a ConfigMap in a specific namespace',
    subHeader: '(for RoleBinding)',
    details: 'This "Role" is allowed to read a "ConfigMap" named "my-config" (must be bound with a "RoleBinding" to limit to a single "ConfigMap" in a single namespace).',
    templateName: 'read-configmap-within-ns',
    kind: 'Role',
  },
  {
    header: 'Allow reading Nodes in the core API groups',
    subHeader: '(for ClusterRoleBinding)',
    details: 'This "ClusterRole" is allowed to read the resource "nodes" in the core group (because a Node is cluster-scoped, this must be bound with a "ClusterRoleBinding" to be effective).',
    templateName: 'read-nodes',
    kind: 'ClusterRole',
  },
  {
    header: '"GET/POST" requests to non-resource endpoint and all subpaths',
    subHeader: '(for ClusterRoleBinding)',
    details: 'This "ClusterRole" is allowed to "GET" and "POST" requests to the non-resource endpoint "/healthz" and all subpaths (must be in the "ClusterRole" bound with a "ClusterRoleBinding" to be effective).',
    templateName: 'get-and-post-to-non-resource-endpoints',
    kind: 'ClusterRole',
  },

];

const SampleYaml = ({sample, loadSampleYaml, downloadSampleYaml}) => {
  const {header, subHeader, details, templateName} = sample;
  return <li className="co-resource-sidebar-item">
    <h5 className="co-resource-sidebar-item__header">
      {header} <span className="co-role-sidebar-subheader">{subHeader}</span>
    </h5>
    <p className="co-resource-sidebar-item__details">
      {details}
    </p>
    <button className="btn btn-link" onClick={() => loadSampleYaml(templateName, sample.kind)}>
      <span className="fa fa-fw fa-paste" aria-hidden="true"></span> Try policy
    </button>
    <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml(templateName)}>
      <span className="fa fa-fw fa-download" aria-hidden="true"></span> Download yaml
    </button>
  </li>;
};


export const RoleSidebar = ({kindObj, loadSampleYaml, downloadSampleYaml, isCreateMode}) => {
  const filteredSamples = isCreateMode ? samples : _.filter(samples, {'kind' : kindObj.kind});
  return <ol className="co-resource-sidebar-list">
    {_.map(filteredSamples, (sample) => <SampleYaml
      key={sample.templateName}
      sample={sample}
      loadSampleYaml={loadSampleYaml}
      downloadSampleYaml={downloadSampleYaml} />)}
  </ol>;
};
