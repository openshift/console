import { K8sModel as K8sKind } from '@console/dynamic-plugin-sdk/src/api/common-types';

export const PrometheusModel: K8sKind = {
  kind: 'Prometheus',
  label: 'Prometheus',
  // t('public~Prometheus')
  labelKey: 'public~Prometheus',
  labelPlural: 'Prometheuses',
  // t('public~Prometheuses')
  labelPluralKey: 'public~Prometheuses',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  abbr: 'PI',
  namespaced: true,
  crd: true,
  plural: 'prometheuses',
  propagationPolicy: 'Foreground',
};

export const ServiceMonitorModel: K8sKind = {
  kind: 'ServiceMonitor',
  label: 'ServiceMonitor',
  // t('public~ServiceMonitor')
  labelKey: 'public~ServiceMonitor',
  labelPlural: 'ServiceMonitors',
  // t('public~ServiceMonitors')
  labelPluralKey: 'public~ServiceMonitors',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  abbr: 'SM',
  namespaced: true,
  crd: true,
  plural: 'servicemonitors',
  propagationPolicy: 'Foreground',
};

export const PodMonitorModel: K8sKind = {
  kind: 'PodMonitor',
  label: 'PodMonitor',
  // t('public~PodMonitor')
  labelKey: 'public~PodMonitor',
  labelPlural: 'PodMonitors',
  // t('public~PodMonitors')
  labelPluralKey: 'public~PodMonitors',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  abbr: 'PM',
  namespaced: true,
  crd: true,
  plural: 'podmonitors',
  propagationPolicy: 'Foreground',
};

export const AlertmanagerModel: K8sKind = {
  kind: 'Alertmanager',
  label: 'Alertmanager',
  // t('public~Alertmanager')
  labelKey: 'public~Alertmanager',
  labelPlural: 'Alertmanagers',
  // t('public~Alertmanagers')
  labelPluralKey: 'public~Alertmanagers',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  abbr: 'AM',
  namespaced: true,
  crd: true,
  plural: 'alertmanagers',
  propagationPolicy: 'Foreground',
};

export const ServiceModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Service',
  // t('public~Service')
  labelKey: 'public~Service',
  plural: 'services',
  abbr: 'S',
  namespaced: true,
  kind: 'Service',
  id: 'service',
  labelPlural: 'Services',
  // t('public~Services')
  labelPluralKey: 'public~Services',
};

export const PodModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Pod',
  // t('public~Pod')
  labelKey: 'public~Pod',
  plural: 'pods',
  abbr: 'P',
  namespaced: true,
  kind: 'Pod',
  id: 'pod',
  labelPlural: 'Pods',
  // t('public~Pods')
  labelPluralKey: 'public~Pods',
};

export const ContainerModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Container',
  // t('public~Container')
  labelKey: 'public~Container',
  plural: 'containers',
  abbr: 'C',
  kind: 'Container',
  id: 'container',
  labelPlural: 'Containers',
  // t('public~Containers')
  labelPluralKey: 'public~Containers',
};

export const DaemonSetModel: K8sKind = {
  label: 'DaemonSet',
  // t('public~DaemonSet')
  labelKey: 'public~DaemonSet',
  apiGroup: 'apps',
  plural: 'daemonsets',
  apiVersion: 'v1',
  abbr: 'DS',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'DaemonSet',
  id: 'daemonset',
  labelPlural: 'DaemonSets',
  // t('public~DaemonSets')
  labelPluralKey: 'public~DaemonSets',
};

export const ReplicationControllerModel: K8sKind = {
  apiVersion: 'v1',
  label: 'ReplicationController',
  // t('public~ReplicationController')
  labelKey: 'public~ReplicationController',
  plural: 'replicationcontrollers',
  abbr: 'RC',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'ReplicationController',
  id: 'replicationcontroller',
  labelPlural: 'ReplicationControllers',
  // t('public~ReplicationControllers')
  labelPluralKey: 'public~ReplicationControllers',
};

export const HorizontalPodAutoscalerModel: K8sKind = {
  label: 'HorizontalPodAutoscaler',
  // t('public~HorizontalPodAutoscaler')
  labelKey: 'public~HorizontalPodAutoscaler',
  plural: 'horizontalpodautoscalers',
  apiVersion: 'v2',
  apiGroup: 'autoscaling',
  abbr: 'HPA',
  namespaced: true,
  kind: 'HorizontalPodAutoscaler',
  id: 'horizontalpodautoscaler',
  labelPlural: 'HorizontalPodAutoscalers',
  // t('public~HorizontalPodAutoscalers')
  labelPluralKey: 'public~HorizontalPodAutoscalers',
};

export const ServiceAccountModel: K8sKind = {
  apiVersion: 'v1',
  label: 'ServiceAccount',
  // t('public~ServiceAccount')
  labelKey: 'public~ServiceAccount',
  plural: 'serviceaccounts',
  abbr: 'SA',
  namespaced: true,
  kind: 'ServiceAccount',
  id: 'serviceaccount',
  labelPlural: 'ServiceAccounts',
  // t('public~ServiceAccounts')
  labelPluralKey: 'public~ServiceAccounts',
};

export const ReplicaSetModel: K8sKind = {
  label: 'ReplicaSet',
  // t('public~ReplicaSet')
  labelKey: 'public~ReplicaSet',
  apiVersion: 'v1',
  apiGroup: 'apps',
  plural: 'replicasets',
  abbr: 'RS',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'ReplicaSet',
  id: 'replicaset',
  labelPlural: 'ReplicaSets',
  // t('public~ReplicaSets')
  labelPluralKey: 'public~ReplicaSets',
};

export const DeploymentModel: K8sKind = {
  label: 'Deployment',
  // t('public~Deployment')
  labelKey: 'public~Deployment',
  apiVersion: 'v1',
  apiGroup: 'apps',
  plural: 'deployments',
  abbr: 'D',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Deployment',
  id: 'deployment',
  labelPlural: 'Deployments',
  // t('public~Deployments')
  labelPluralKey: 'public~Deployments',
};

export const DeploymentConfigModel: K8sKind = {
  label: 'DeploymentConfig',
  // t('public~DeploymentConfig')
  labelKey: 'public~DeploymentConfig',
  apiVersion: 'v1',
  apiGroup: 'apps.openshift.io',
  plural: 'deploymentconfigs',
  abbr: 'DC',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'DeploymentConfig',
  id: 'deploymentconfig',
  labelPlural: 'DeploymentConfigs',
  // t('public~DeploymentConfigs')
  labelPluralKey: 'public~DeploymentConfigs',
};

export const BuildConfigModel: K8sKind = {
  label: 'BuildConfig',
  // t('public~BuildConfig')
  labelKey: 'public~BuildConfig',
  apiVersion: 'v1',
  apiGroup: 'build.openshift.io',
  plural: 'buildconfigs',
  abbr: 'BC',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'BuildConfig',
  id: 'buildconfig',
  labelPlural: 'BuildConfigs',
  // t('public~BuildConfigs')
  labelPluralKey: 'public~BuildConfigs',
};

export const BuildModel: K8sKind = {
  label: 'Build',
  // t('public~Build')
  labelKey: 'public~Build',
  apiVersion: 'v1',
  apiGroup: 'build.openshift.io',
  plural: 'builds',
  abbr: 'B',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Build',
  id: 'build',
  labelPlural: 'Builds',
  // t('public~Builds')
  labelPluralKey: 'public~Builds',
};

export const TemplateModel: K8sKind = {
  label: 'Template',
  // t('public~Template')
  labelKey: 'public~Template',
  apiVersion: 'v1',
  apiGroup: 'template.openshift.io',
  plural: 'templates',
  abbr: 'T',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Template',
  id: 'template',
  labelPlural: 'Templates',
  // t('public~Templates')
  labelPluralKey: 'public~Templates',
};

export const TemplateInstanceModel: K8sKind = {
  label: 'Template Instance',
  apiVersion: 'v1',
  apiGroup: 'template.openshift.io',
  plural: 'templateinstances',
  abbr: 'TI',
  namespaced: true,
  kind: 'TemplateInstance',
  id: 'templateinstance',
  labelPlural: 'Template Instances',
};

export const ImageStreamModel: K8sKind = {
  label: 'ImageStream',
  // t('public~ImageStream')
  labelKey: 'public~ImageStream',
  apiVersion: 'v1',
  apiGroup: 'image.openshift.io',
  plural: 'imagestreams',
  abbr: 'IS',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'ImageStream',
  id: 'imagestream',
  labelPlural: 'ImageStreams',
  // t('public~ImageStreams')
  labelPluralKey: 'public~ImageStreams',
};

export const ImageStreamTagModel: K8sKind = {
  label: 'ImageStreamTag',
  // t('public~ImageStreamTag')
  labelKey: 'public~ImageStreamTag',
  apiVersion: 'v1',
  apiGroup: 'image.openshift.io',
  plural: 'imagestreamtags',
  abbr: 'IST',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'ImageStreamTag',
  id: 'imagestreamtag',
  labelPlural: 'ImageStreamTags',
  // t('public~ImageStreamTags')
  labelPluralKey: 'public~ImageStreamTags',
};

export const ImageStreamImportsModel: K8sKind = {
  label: 'ImageStreamImport',
  // t('public~ImageStreamImport')
  labelKey: 'public~ImageStreamImport',
  apiVersion: 'v1',
  apiGroup: 'image.openshift.io',
  plural: 'imagestreamimports',
  abbr: 'ISI',
  namespaced: true,
  kind: 'ImageStreamImport',
  id: 'imagestreamimport',
  labelPlural: 'ImageStreamImports',
  // t('public~ImageStreamImports')
  labelPluralKey: 'ImageStreamImports',
};

export const JobModel: K8sKind = {
  label: 'Job',
  // t('public~Job')
  labelKey: 'public~Job',
  apiVersion: 'v1',
  apiGroup: 'batch',
  plural: 'jobs',
  abbr: 'J',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Job',
  id: 'job',
  labelPlural: 'Jobs',
  // t('public~Jobs')
  labelPluralKey: 'public~Jobs',
};

export const NodeModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Node',
  // t('public~Node')
  labelKey: 'public~Node',
  plural: 'nodes',
  abbr: 'N',
  kind: 'Node',
  id: 'node',
  labelPlural: 'Nodes',
  // t('public~Nodes')
  labelPluralKey: 'public~Nodes',
};

export const CertificateSigningRequestModel: K8sKind = {
  apiVersion: 'v1',
  apiGroup: 'certificates.k8s.io',
  label: 'CertificateSigningRequest',
  // t('public~CertificateSigningRequest')
  labelKey: 'public~CertificateSigningRequest',
  plural: 'certificatesigningrequests',
  abbr: 'CSR',
  kind: 'CertificateSigningRequest',
  id: 'certificateigningrequests',
  labelPlural: 'CertificateSigningRequests',
  // t('public~CertificateSigningRequests')
  labelPluralKey: 'public~CertificateSigningRequests',
};

export const EventModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Event',
  // t('public~Event')
  labelKey: 'public~Event',
  plural: 'events',
  abbr: 'E',
  namespaced: true,
  kind: 'Event',
  id: 'event',
  labelPlural: 'Events',
  // t('public~Events')
  labelPluralKey: 'public~Events',
};

export const ComponentStatusModel: K8sKind = {
  apiVersion: 'v1',
  label: 'ComponentStatus',
  // t('public~ComponentStatus')
  labelKey: 'public~ComponentStatus',
  labelPlural: 'ComponentStatuses',
  // t('public~ComponentStatuses')
  labelPluralKey: 'public~ComponentStatuses',
  plural: 'componentstatuses',
  abbr: 'CS',
  kind: 'ComponentStatus',
  id: 'componentstatus',
};

export const NamespaceModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Namespace',
  // t('public~Namespace')
  labelKey: 'public~Namespace',
  plural: 'namespaces',
  abbr: 'NS',
  kind: 'Namespace',
  id: 'namespace',
  labelPlural: 'Namespaces',
  // t('public~Namespaces')
  labelPluralKey: 'public~Namespaces',
};

export const ProjectModel: K8sKind = {
  apiVersion: 'v1',
  apiGroup: 'project.openshift.io',
  label: 'Project',
  // t('public~Project')
  labelKey: 'public~Project',
  plural: 'projects',
  abbr: 'PR',
  kind: 'Project',
  id: 'project',
  labelPlural: 'Projects',
  // t('public~Projects')
  labelPluralKey: 'public~Projects',
};

export const ProjectRequestModel: K8sKind = {
  apiVersion: 'v1',
  apiGroup: 'project.openshift.io',
  label: 'ProjectRequest',
  // t('public~ProjectRequest')
  labelKey: 'public~ProjectRequest',
  plural: 'projectrequests',
  abbr: '',
  kind: 'ProjectRequest',
  id: 'projectrequest',
  labelPlural: 'ProjectRequests',
  // t('public~ProjectRequests')
  labelPluralKey: 'public~ProjectRequests',
};

export const IngressModel: K8sKind = {
  label: 'Ingress',
  // t('public~Ingress')
  labelKey: 'public~Ingress',
  labelPlural: 'Ingresses',
  // t('public~Ingresses')
  labelPluralKey: 'public~Ingresses',
  apiGroup: 'networking.k8s.io',
  apiVersion: 'v1',
  plural: 'ingresses',
  abbr: 'I',
  namespaced: true,
  kind: 'Ingress',
  id: 'ingress',
};

export const RouteModel: K8sKind = {
  label: 'Route',
  // t('public~Route')
  labelKey: 'public~Route',
  labelPlural: 'Routes',
  // t('public~Routes')
  labelPluralKey: 'public~Routes',
  apiGroup: 'route.openshift.io',
  apiVersion: 'v1',
  plural: 'routes',
  abbr: 'RT',
  namespaced: true,
  kind: 'Route',
  id: 'route',
};

export const ConfigMapModel: K8sKind = {
  apiVersion: 'v1',
  label: 'ConfigMap',
  // t('public~ConfigMap')
  labelKey: 'public~ConfigMap',
  plural: 'configmaps',
  abbr: 'CM',
  namespaced: true,
  kind: 'ConfigMap',
  id: 'configmap',
  labelPlural: 'ConfigMaps',
  // t('public~ConfigMaps')
  labelPluralKey: 'public~ConfigMaps',
};

export const SecretModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Secret',
  // t('public~Secret')
  labelKey: 'public~Secret',
  plural: 'secrets',
  abbr: 'S',
  namespaced: true,
  kind: 'Secret',
  id: 'secret',
  labelPlural: 'Secrets',
  // t('public~Secrets')
  labelPluralKey: 'public~Secrets',
};

export const ClusterRoleBindingModel: K8sKind = {
  label: 'ClusterRoleBinding',
  // t('public~ClusterRoleBinding')
  labelKey: 'public~ClusterRoleBinding',
  apiGroup: 'rbac.authorization.k8s.io',
  apiVersion: 'v1',
  plural: 'clusterrolebindings',
  abbr: 'CRB',
  kind: 'ClusterRoleBinding',
  id: 'clusterrolebinding',
  labelPlural: 'ClusterRoleBindings',
  // t('public~ClusterRoleBindings')
  labelPluralKey: 'public~ClusterRoleBindings',
};

export const ClusterRoleModel: K8sKind = {
  label: 'ClusterRole',
  // t('public~ClusterRole')
  labelKey: 'public~ClusterRole',
  apiGroup: 'rbac.authorization.k8s.io',
  apiVersion: 'v1',
  plural: 'clusterroles',
  abbr: 'CR',
  kind: 'ClusterRole',
  id: 'clusterrole',
  labelPlural: 'ClusterRoles',
  // t('public~ClusterRoles')
  labelPluralKey: 'public~ClusterRoles',
};

export const RoleBindingModel: K8sKind = {
  label: 'RoleBinding',
  // t('public~RoleBinding')
  labelKey: 'public~RoleBinding',
  apiGroup: 'rbac.authorization.k8s.io',
  apiVersion: 'v1',
  plural: 'rolebindings',
  abbr: 'RB',
  namespaced: true,
  kind: 'RoleBinding',
  id: 'rolebinding',
  labelPlural: 'RoleBindings',
  // t('public~RoleBindings')
  labelPluralKey: 'public~RoleBindings',
};

export const RoleModel: K8sKind = {
  label: 'Role',
  // t('public~Role')
  labelKey: 'public~Role',
  apiGroup: 'rbac.authorization.k8s.io',
  apiVersion: 'v1',
  plural: 'roles',
  abbr: 'R',
  namespaced: true,
  kind: 'Role',
  id: 'role',
  labelPlural: 'Roles',
  // t('public~Roles')
  labelPluralKey: 'public~Roles',
};

export const SelfSubjectAccessReviewModel: K8sKind = {
  label: 'SelfSubjectAccessReview',
  // t('public~SelfSubjectAccessReview')
  labelKey: 'public~SelfSubjectAccessReview',
  apiGroup: 'authorization.k8s.io',
  apiVersion: 'v1',
  plural: 'selfsubjectaccessreviews',
  abbr: 'SSAR',
  namespaced: true,
  kind: 'SelfSubjectAccessReview',
  id: 'selfsubjectaccessreview',
  labelPlural: 'SelfSubjectAccessReviews',
  // t('public~SelfSubjectAccessReviews')
  labelPluralKey: 'public~SelfSubjectAccessReviews',
};

export const SelfSubjectReviewModel: K8sKind = {
  label: 'SelfSubjectReview',
  // t('public~SelfSubjectReview')
  labelKey: 'public~SelfSubjectReview',
  apiGroup: 'authorization.k8s.io',
  apiVersion: 'v1',
  plural: 'selfsubjectreviews',
  abbr: 'SSR',
  namespaced: true,
  kind: 'SelfSubjectReview',
  id: 'selfsubjectreview',
  labelPlural: 'SelfSubjectReviews',
  // t('public~SelfSubjectReviews')
  labelPluralKey: 'public~SelfSubjectReviews',
};

export const ResourceAccessReviewsModel: K8sKind = {
  label: 'ResourceAccessReview',
  // t('public~ResourceAccessReview')
  labelKey: 'public~ResourceAccessReview',
  apiGroup: 'authorization.openshift.io',
  apiVersion: 'v1',
  plural: 'resourceaccessreviews',
  abbr: 'LRAR',
  namespaced: false,
  kind: 'ResourceAccessReview',
  id: 'resourceaccessreview',
  labelPlural: 'ResourceAccessReviews',
  // t('public~ResourceAccessReviews')
  labelPluralKey: 'public~ResourceAccessReviews',
};

export const LocalResourceAccessReviewsModel: K8sKind = {
  label: 'LocalResourceAccessReview',
  // t('public~LocalResourceAccessReview')
  labelKey: 'public~LocalResourceAccessReview',
  apiGroup: 'authorization.openshift.io',
  apiVersion: 'v1',
  plural: 'localresourceaccessreviews',
  abbr: 'LRAR',
  namespaced: true,
  kind: 'LocalResourceAccessReview',
  id: 'localresourceaccessreview',
  labelPlural: 'LocalResourceAccessReviews',
  // t('public~LocalResourceAccessReviews')
  labelPluralKey: 'public~LocalResourceAccessReviews',
};

export const PersistentVolumeModel: K8sKind = {
  label: 'PersistentVolume',
  // t('public~PersistentVolume')
  labelKey: 'public~PersistentVolume',
  apiVersion: 'v1',
  plural: 'persistentvolumes',
  abbr: 'PV',
  kind: 'PersistentVolume',
  id: 'persistentvolume',
  labelPlural: 'PersistentVolumes',
  // t('public~PersistentVolumes')
  labelPluralKey: 'public~PersistentVolumes',
};

export const PersistentVolumeClaimModel: K8sKind = {
  label: 'PersistentVolumeClaim',
  // t('public~PersistentVolumeClaim')
  labelKey: 'public~PersistentVolumeClaim',
  apiVersion: 'v1',
  plural: 'persistentvolumeclaims',
  abbr: 'PVC',
  namespaced: true,
  kind: 'PersistentVolumeClaim',
  id: 'persistentvolumeclaim',
  labelPlural: 'PersistentVolumeClaims',
  // t('public~PersistentVolumeClaims')
  labelPluralKey: 'public~PersistentVolumeClaims',
};

export const StatefulSetModel: K8sKind = {
  label: 'StatefulSet',
  // t('public~StatefulSet')
  labelKey: 'public~StatefulSet',
  apiGroup: 'apps',
  apiVersion: 'v1',
  plural: 'statefulsets',
  abbr: 'SS',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'StatefulSet',
  id: 'statefulset',
  labelPlural: 'StatefulSets',
  // t('public~StatefulSets')
  labelPluralKey: 'public~StatefulSets',
};

export const ResourceQuotaModel: K8sKind = {
  label: 'ResourceQuota',
  // t('public~ResourceQuota')
  labelKey: 'public~ResourceQuota',
  apiVersion: 'v1',
  plural: 'resourcequotas',
  abbr: 'RQ',
  namespaced: true,
  kind: 'ResourceQuota',
  id: 'resourcequota',
  labelPlural: 'ResourceQuotas',
  // t('public~ResourceQuotas')
  labelPluralKey: 'public~ResourceQuotas',
};

export const ClusterResourceQuotaModel: K8sKind = {
  label: 'ClusterResourceQuota',
  // t('public~ClusterResourceQuota')
  labelKey: 'public~ClusterResourceQuota',
  apiGroup: 'quota.openshift.io',
  apiVersion: 'v1',
  plural: 'clusterresourcequotas',
  abbr: 'CRQ',
  namespaced: false,
  kind: 'ClusterResourceQuota',
  id: 'clusterresourcequota',
  labelPlural: 'ClusterResourceQuotas',
  // t('public~ClusterResourceQuotas')
  labelPluralKey: 'public~ClusterResourceQuotas',
  crd: true,
};

export const AppliedClusterResourceQuotaModel: K8sKind = {
  label: 'AppliedClusterResourceQuota',
  // t('public~AppliedClusterResourceQuota')
  labelKey: 'public~AppliedClusterResourceQuota',
  apiGroup: 'quota.openshift.io',
  apiVersion: 'v1',
  plural: 'appliedclusterresourcequotas',
  abbr: 'ACRQ',
  namespaced: true,
  kind: 'AppliedClusterResourceQuota',
  id: 'appliedclusterresourcequota',
  labelPlural: 'AppliedClusterResourceQuotas',
  // t('public~AppliedClusterResourceQuotas')
  labelPluralKey: 'public~AppliedClusterResourceQuotas',
  crd: true,
};

export const NetworkPolicyModel: K8sKind = {
  label: 'NetworkPolicy',
  // t('public~NetworkPolicy')
  labelKey: 'public~NetworkPolicy',
  labelPlural: 'NetworkPolicies',
  // t('public~NetworkPolicies')
  labelPluralKey: 'public~NetworkPolicies',
  apiVersion: 'v1',
  apiGroup: 'networking.k8s.io',
  plural: 'networkpolicies',
  abbr: 'NP',
  namespaced: true,
  kind: 'NetworkPolicy',
  id: 'networkpolicy',
};

export const CustomResourceDefinitionModel: K8sKind = {
  label: 'CustomResourceDefinition',
  // t('public~CustomResourceDefinition')
  labelKey: 'public~CustomResourceDefinition',
  apiGroup: 'apiextensions.k8s.io',
  apiVersion: 'v1',
  abbr: 'CRD',
  namespaced: false,
  plural: 'customresourcedefinitions',
  kind: 'CustomResourceDefinition',
  id: 'customresourcedefinition',
  labelPlural: 'CustomResourceDefinitions',
  // t('public~CustomResourceDefinitions')
  labelPluralKey: 'public~CustomResourceDefinitions',
};

export const CronJobModel: K8sKind = {
  label: 'CronJob',
  // t('public~CronJob')
  labelKey: 'public~CronJob',
  apiVersion: 'v1',
  apiGroup: 'batch',
  plural: 'cronjobs',
  abbr: 'CJ',
  namespaced: true,
  kind: 'CronJob',
  id: 'cronjob',
  labelPlural: 'CronJobs',
  // t('public~CronJobs')
  labelPluralKey: 'public~CronJobs',
  propagationPolicy: 'Foreground',
};

export const StorageClassModel: K8sKind = {
  label: 'StorageClass',
  // t('public~StorageClass')
  labelKey: 'public~StorageClass',
  labelPlural: 'StorageClasses',
  // t('public~StorageClasses')
  labelPluralKey: 'public~StorageClasses',
  apiVersion: 'v1',
  apiGroup: 'storage.k8s.io',
  plural: 'storageclasses',
  abbr: 'SC',
  namespaced: false,
  kind: 'StorageClass',
  id: 'storageclass',
};

export const LimitRangeModel: K8sKind = {
  label: 'LimitRange',
  // t('public~LimitRange')
  labelKey: 'public~LimitRange',
  apiVersion: 'v1',
  plural: 'limitranges',
  abbr: 'LR',
  namespaced: true,
  kind: 'LimitRange',
  id: 'limitrange',
  labelPlural: 'LimitRanges',
  // t('public~LimitRanges')
  labelPluralKey: 'public~LimitRanges',
};

export const APIServiceModel: K8sKind = {
  label: 'APIService',
  // t('public~APIService')
  labelKey: 'public~APIService',
  labelPlural: 'APIServices',
  // t('public~APIServices')
  labelPluralKey: 'APIServices',
  apiVersion: 'v1',
  apiGroup: 'apiregistration.k8s.io',
  plural: 'apiservices',
  abbr: 'APIS',
  namespaced: false,
  kind: 'APIService',
  id: 'apiservice',
  crd: true,
};

export const UserModel: K8sKind = {
  label: 'User',
  // t('public~User')
  labelKey: 'public~User',
  labelPlural: 'Users',
  // t('public~Users')
  labelPluralKey: 'public~Users',
  apiVersion: 'v1',
  apiGroup: 'user.openshift.io',
  plural: 'users',
  abbr: 'U',
  namespaced: false,
  kind: 'User',
  id: 'user',
  crd: true,
};

export const GroupModel: K8sKind = {
  label: 'Group',
  // t('public~Group')
  labelKey: 'public~Group',
  labelPlural: 'Groups',
  // t('public~Groups')
  labelPluralKey: 'public~Groups',
  apiVersion: 'v1',
  apiGroup: 'user.openshift.io',
  plural: 'groups',
  abbr: 'G',
  namespaced: false,
  kind: 'Group',
  id: 'group',
  crd: true,
};

// Cluster API resources
// https://github.com/openshift/cluster-api
export const MachineModel: K8sKind = {
  label: 'Machine',
  // t('public~Machine')
  labelKey: 'public~Machine',
  labelPlural: 'Machines',
  // t('public~Machines')
  labelPluralKey: 'public~Machines',
  apiVersion: 'v1beta1',
  apiGroup: 'machine.openshift.io',
  plural: 'machines',
  abbr: 'M',
  namespaced: true,
  kind: 'Machine',
  id: 'machine',
  crd: true,
};

export const MachineSetModel: K8sKind = {
  label: 'MachineSet',
  // t('public~MachineSet')
  labelKey: 'public~MachineSet',
  labelPlural: 'MachineSets',
  // t('public~MachineSet')
  labelPluralKey: 'public~MachineSet',
  apiVersion: 'v1beta1',
  apiGroup: 'machine.openshift.io',
  plural: 'machinesets',
  abbr: 'MS',
  namespaced: true,
  kind: 'MachineSet',
  id: 'machineset',
  crd: true,
};

export const MachineDeploymentModel: K8sKind = {
  label: 'MachineDeployment',
  // t('public~MachineDeployment')
  labelKey: 'public~MachineDeployment',
  labelPlural: 'MachineDeployments',
  // t('public~MachineDeployments')
  labelPluralKey: 'public~MachineDeployments',
  apiVersion: 'v1beta1',
  apiGroup: 'machine.openshift.io',
  plural: 'machinedeployments',
  abbr: 'MD',
  namespaced: true,
  kind: 'MachineDeployment',
  id: 'machinedeployment',
  crd: true,
};

export const MachineConfigPoolModel: K8sKind = {
  label: 'MachineConfigPool',
  // t('public~MachineConfigPool')
  labelKey: 'public~MachineConfigPool',
  labelPlural: 'MachineConfigPools',
  // t('public~MachineConfigPools')
  labelPluralKey: 'public~MachineConfigPools',
  apiVersion: 'v1',
  apiGroup: 'machineconfiguration.openshift.io',
  plural: 'machineconfigpools',
  abbr: 'MCP',
  namespaced: false,
  kind: 'MachineConfigPool',
  id: 'machineconfigpool',
  crd: true,
};

export const MachineConfigModel: K8sKind = {
  label: 'MachineConfig',
  // t('public~MachineConfig')
  labelKey: 'public~MachineConfig',
  labelPlural: 'MachineConfigs',
  // t('public~MachineConfigs')
  labelPluralKey: 'public~MachineConfigs',
  apiVersion: 'v1',
  apiGroup: 'machineconfiguration.openshift.io',
  plural: 'machineconfigs',
  abbr: 'MC',
  namespaced: false,
  kind: 'MachineConfig',
  id: 'machineconfigpool',
  crd: true,
};

export const MachineAutoscalerModel: K8sKind = {
  label: 'MachineAutoscaler',
  // t('public~MachineAutoscaler')
  labelKey: 'public~MachineAutoscaler',
  labelPlural: 'MachineAutoscalers',
  // t('public~MachineAutoscalers')
  labelPluralKey: 'public~MachineAutoscalers',
  apiVersion: 'v1beta1',
  apiGroup: 'autoscaling.openshift.io',
  plural: 'machineautoscalers',
  abbr: 'MA',
  namespaced: true,
  kind: 'MachineAutoscaler',
  id: 'machineautoscaler',
  crd: true,
};

export const MachineHealthCheckModel: K8sKind = {
  label: 'MachineHealthCheck',
  // t('public~MachineHealthCheck')
  labelKey: 'public~MachineHealthCheck',
  labelPlural: 'MachineHealthChecks',
  // t('public~MachineHealthChecks')
  labelPluralKey: 'public~MachineHealthChecks',
  apiVersion: 'v1beta1',
  apiGroup: 'machine.openshift.io',
  plural: 'machinehealthchecks',
  abbr: 'MHC',
  namespaced: true,
  kind: 'MachineHealthCheck',
  id: 'machinehealthcheck',
  crd: true,
};

// Openshift cluster resources
export const ClusterOperatorModel: K8sKind = {
  label: 'ClusterOperator',
  // t('public~ClusterOperator')
  labelKey: 'public~ClusterOperator',
  labelPlural: 'ClusterOperators',
  // t('public~ClusterOperators')
  labelPluralKey: 'public~ClusterOperators',
  apiVersion: 'v1',
  apiGroup: 'config.openshift.io',
  plural: 'clusteroperators',
  abbr: 'CO',
  namespaced: false,
  kind: 'ClusterOperator',
  id: 'clusteroperator',
  crd: true,
};

export const ClusterVersionModel: K8sKind = {
  label: 'ClusterVersion',
  // t('public~ClusterVersion')
  labelKey: 'public~ClusterVersion',
  labelPlural: 'ClusterVersions',
  // t('public~ClusterVersions')
  labelPluralKey: 'public~ClusterVersions',
  apiVersion: 'v1',
  apiGroup: 'config.openshift.io',
  plural: 'clusterversions',
  abbr: 'CV',
  namespaced: false,
  kind: 'ClusterVersion',
  id: 'clusterversion',
  crd: true,
};

export const CSIDriverModel: K8sKind = {
  label: 'CSIDriver',
  // t('public~CSIDriver')
  labelKey: 'public~CSIDriver',
  labelPlural: 'CSIDrivers',
  // t('public~CSIDrivers')
  labelPluralKey: 'public~CSIDrivers',
  apiVersion: 'v1',
  apiGroup: 'storage.k8s.io',
  plural: 'csidrivers',
  abbr: 'CSI',
  namespaced: false,
  kind: 'CSIDriver',
  id: 'csidriver',
  crd: true,
};

export const ClusterAutoscalerModel: K8sKind = {
  label: 'ClusterAutoscaler',
  // t('public~ClusterAutoscaler')
  labelKey: 'public~ClusterAutoscaler',
  labelPlural: 'ClusterAutoscalers',
  // t('public~ClusterAutoscalers')
  labelPluralKey: 'public~ClusterAutoscalers',
  apiVersion: 'v1',
  apiGroup: 'autoscaling.openshift.io',
  plural: 'clusterautoscalers',
  abbr: 'CA',
  namespaced: false,
  kind: 'ClusterAutoscaler',
  id: 'clusterautoscaler',
  crd: true,
};

// OpenShift global configuration
export const OAuthModel: K8sKind = {
  label: 'OAuth',
  // t('public~OAuth')
  labelKey: 'public~OAuth',
  labelPlural: 'OAuths',
  // t('public~OAuths')
  labelPluralKey: 'public~OAuths',
  apiVersion: 'v1',
  apiGroup: 'config.openshift.io',
  plural: 'oauths',
  abbr: 'OA',
  namespaced: false,
  kind: 'OAuth',
  id: 'oauth',
  crd: true,
};

export const InfrastructureModel: K8sKind = {
  label: 'Infrastructure',
  // t('public~Infrastructure')
  labelKey: 'public~Infrastructure',
  labelPlural: 'Infrastructures',
  // t('public~Infrastructures')
  labelPluralKey: 'public~Infrastructures',
  apiVersion: 'v1',
  apiGroup: 'config.openshift.io',
  plural: 'infrastructures',
  abbr: 'INF',
  namespaced: false,
  kind: 'Infrastructure',
  id: 'infrastructure',
  crd: true,
};

export const NetworkOperatorConfigModel: K8sKind = {
  label: 'Network',
  labelPlural: 'Networks',
  apiVersion: 'v1',
  apiGroup: 'config.openshift.io',
  plural: 'networks',
  abbr: 'NO',
  namespaced: false,
  kind: 'Network',
  id: 'network',
  crd: true,
};

export const ConsoleOperatorConfigModel: K8sKind = {
  label: 'Console',
  labelPlural: 'Consoles',
  apiVersion: 'v1',
  apiGroup: 'operator.openshift.io',
  plural: 'consoles',
  abbr: 'C',
  namespaced: false,
  kind: 'Console',
  id: 'console',
  crd: true,
};

export const ConsoleLinkModel: K8sKind = {
  label: 'ConsoleLink',
  // t('public~ConsoleLink')
  labelKey: 'public~ConsoleLink',
  labelPlural: 'ConsoleLinks',
  // t('public~ConsoleLinks')
  labelPluralKey: 'public~ConsoleLinks',
  apiVersion: 'v1',
  apiGroup: 'console.openshift.io',
  plural: 'consolelinks',
  abbr: 'CL',
  namespaced: false,
  kind: 'ConsoleLink',
  id: 'consolelink',
  crd: true,
};

export const ConsoleCLIDownloadModel: K8sKind = {
  label: 'ConsoleCLIDownload',
  // t('public~ConsoleCLIDownload')
  labelKey: 'public~ConsoleCLIDownload',
  labelPlural: 'ConsoleCLIDownloads',
  // t('public~ConsoleCLIDownloads')
  labelPluralKey: 'public~ConsoleCLIDownloads',
  apiVersion: 'v1',
  apiGroup: 'console.openshift.io',
  plural: 'consoleclidownloads',
  abbr: 'CCD',
  namespaced: false,
  kind: 'ConsoleCLIDownload',
  id: 'consoleclidownload',
  crd: true,
};

export const ConsoleNotificationModel: K8sKind = {
  label: 'ConsoleNotification',
  // t('public~ConsoleNotification')
  labelKey: 'public~ConsoleNotification',
  labelPlural: 'ConsoleNotifications',
  // t('public~ConsoleNotifications')
  labelPluralKey: 'public~ConsoleNotifications',
  apiVersion: 'v1',
  apiGroup: 'console.openshift.io',
  plural: 'consolenotifications',
  abbr: 'CN',
  namespaced: false,
  kind: 'ConsoleNotification',
  id: 'consolenotification',
  crd: true,
};

export const ConsoleExternalLogLinkModel: K8sKind = {
  label: 'ConsoleExternalLogLink',
  // t('public~ConsoleExternalLogLink')
  labelKey: 'public~ConsoleExternalLogLink',
  labelPlural: 'ConsoleExternalLogLinks',
  // t('public~ConsoleExternalLogLinks')
  labelPluralKey: 'public~ConsoleExternalLogLinks',
  apiVersion: 'v1',
  apiGroup: 'console.openshift.io',
  plural: 'consoleexternalloglinks',
  abbr: 'CELL',
  namespaced: false,
  kind: 'ConsoleExternalLogLink',
  id: 'consoleexternalloglink',
  crd: true,
};

export const ConsoleYAMLSampleModel: K8sKind = {
  label: 'ConsoleYAMLSample',
  // t('public~ConsoleYAMLSample')
  labelKey: 'public~ConsoleYAMLSample',
  labelPlural: 'ConsoleYAMLSamples',
  // t('public~ConsoleYAMLSamples')
  labelPluralKey: 'public~ConsoleYAMLSamples',
  apiVersion: 'v1',
  apiGroup: 'console.openshift.io',
  plural: 'consoleyamlsamples',
  abbr: 'CYS',
  namespaced: false,
  kind: 'ConsoleYAMLSample',
  id: 'consoleyamlsample',
  crd: true,
};

export const VolumeSnapshotModel: K8sKind = {
  label: 'VolumeSnapshot',
  // t('public~VolumeSnapshot')
  labelKey: 'public~VolumeSnapshot',
  apiVersion: 'v1',
  apiGroup: 'snapshot.storage.k8s.io',
  plural: 'volumesnapshots',
  abbr: 'VS',
  namespaced: true,
  kind: 'VolumeSnapshot',
  id: 'volumesnapshot',
  labelPlural: 'VolumeSnapshots',
  // t('public~VolumeSnapshots')
  labelPluralKey: 'public~VolumeSnapshots',
  crd: true,
};

export const VolumeSnapshotClassModel: K8sKind = {
  label: 'VolumeSnapshotClass',
  // t('public~VolumeSnapshotClass')
  labelKey: 'public~VolumeSnapshotClass',
  apiVersion: 'v1',
  apiGroup: 'snapshot.storage.k8s.io',
  plural: 'volumesnapshotclasses',
  abbr: 'VSC',
  namespaced: false,
  kind: 'VolumeSnapshotClass',
  id: 'volumesnapshotclass',
  labelPlural: 'VolumeSnapshotClasses',
  // t('public~VolumeSnapshotClasses')
  labelPluralKey: 'public~VolumeSnapshotClasses',
  crd: true,
};

export const VolumeSnapshotContentModel: K8sKind = {
  label: 'VolumeSnapshotContent',
  // t('public~VolumeSnapshotContent')
  labelKey: 'public~VolumeSnapshotContent',
  apiVersion: 'v1',
  apiGroup: 'snapshot.storage.k8s.io',
  plural: 'volumesnapshotcontents',
  abbr: 'VSC',
  namespaced: false,
  kind: 'VolumeSnapshotContent',
  id: 'volumesnapshotcontent',
  labelPlural: 'VolumeSnapshotContents',
  // t('public~VolumeSnapshotContents')
  labelPluralKey: 'public~VolumeSnapshotContents',
  crd: true,
};

export const ConsolePluginModel: K8sKind = {
  label: 'ConsolePlugin',
  // t('public~ConsolePlugin')
  labelKey: 'public~ConsolePlugin',
  apiVersion: 'v1',
  apiGroup: 'console.openshift.io',
  plural: 'consoleplugins',
  abbr: 'CP',
  namespaced: false,
  kind: 'ConsolePlugin',
  id: 'consoleplugin',
  labelPlural: 'ConsolePlugins',
  // t('public~ConsolePlugins')
  labelPluralKey: 'public~ConsolePlugins',
  crd: true,
};

export const CloudCredentialModel: K8sKind = {
  kind: 'CloudCredential',
  label: 'CloudCredential',
  labelPlural: 'CloudCredentials',
  apiGroup: 'operator.openshift.io',
  apiVersion: 'v1',
  abbr: 'CO',
  plural: 'cloudcredentials',
};

export const AuthenticationModel: K8sKind = {
  kind: 'Authentication',
  label: 'Authentication',
  labelPlural: 'Authentications',
  apiGroup: 'config.openshift.io',
  apiVersion: 'v1',
  plural: 'authentications',
  abbr: 'AU',
};
