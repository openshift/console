import { K8sKind } from '../module/k8s';

export const CatalogSourceConfigModel: K8sKind = {
  kind: 'CatalogSourceConfig',
  label: 'CatalogSourceConfig',
  labelPlural: 'CatalogSourceConfigs',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1',
  path: 'catalogsourceconfigs',
  abbr: 'CSC',
  namespaced: true,
  crd: true,
  plural: 'catalogsourceconfigs',
};

export const OperatorSourceModel: K8sKind = {
  kind: 'OperatorSource',
  label: 'OperatorSource',
  labelPlural: 'OperatorSource',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1',
  path: 'operatorsources',
  abbr: 'OSRC',
  namespaced: true,
  crd: true,
  plural: 'operatorsources',
};

export const CatalogSourceModel: K8sKind = {
  kind: 'CatalogSource',
  label: 'CatalogSource',
  labelPlural: 'CatalogSources',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  path: 'catalogsources',
  abbr: 'CS',
  namespaced: true,
  crd: true,
  plural: 'catalogsources',
};

export const PackageManifestModel: K8sKind = {
  kind: 'PackageManifest',
  label: 'PackageManifest',
  labelPlural: 'PackageManifests',
  apiGroup: 'packages.operators.coreos.com',
  apiVersion: 'v1',
  path: 'packagemanifests',
  abbr: 'PM',
  namespaced: true,
  crd: true,
  plural: 'packagemanifests',
};

export const ClusterServiceVersionModel: K8sKind = {
  kind: 'ClusterServiceVersion',
  label: 'ClusterServiceVersion',
  labelPlural: 'ClusterServiceVersions',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  path: 'clusterserviceversions',
  abbr: 'CSV',
  namespaced: true,
  crd: true,
  plural: 'clusterserviceversions',
  propagationPolicy : 'Foreground',
};

export const InstallPlanModel: K8sKind = {
  kind: 'InstallPlan',
  label: 'InstallPlan',
  labelPlural: 'InstallPlans',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  path: 'installplans',
  abbr: 'IP',
  namespaced: true,
  crd: true,
  plural: 'installplans',
};

export const SubscriptionModel: K8sKind = {
  kind: 'Subscription',
  label: 'Subscription',
  labelPlural: 'Subscriptions',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  path: 'subscriptions',
  abbr: 'SUB',
  namespaced: true,
  crd: true,
  plural: 'subscriptions',
};

export const OperatorGroupModel: K8sKind = {
  kind: 'OperatorGroup',
  label: 'OperatorGroup',
  labelPlural: 'OperatorGroups',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1',
  path: 'operatorgroups',
  abbr: 'OG',
  namespaced: true,
  crd: true,
  plural: 'operatorgroups',
};

export const PrometheusModel: K8sKind = {
  kind: 'Prometheus',
  label: 'Prometheus',
  labelPlural: 'Prometheuses',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  path: 'prometheuses',
  abbr: 'PI',
  namespaced: true,
  crd: true,
  plural: 'prometheuses',
  propagationPolicy : 'Foreground',
};

export const ServiceMonitorModel: K8sKind = {
  kind: 'ServiceMonitor',
  label: 'Service Monitor',
  labelPlural: 'Service Monitors',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  path: 'servicemonitors',
  abbr: 'SM',
  namespaced: true,
  crd: true,
  plural: 'servicemonitors',
  propagationPolicy : 'Foreground',
};

export const AlertmanagerModel: K8sKind = {
  kind: 'Alertmanager',
  label: 'Alertmanager',
  labelPlural: 'Alertmanagers',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  path: 'alertmanagers',
  abbr: 'AM',
  namespaced: true,
  crd: true,
  plural: 'alertmanagers',
  propagationPolicy : 'Foreground',
};

export const ChargebackReportModel: K8sKind = {
  kind: 'Report',
  label: 'Report',
  labelPlural: 'Reports',
  apiGroup: 'metering.openshift.io',
  path: 'reports',
  apiVersion: 'v1alpha1',
  crd: true,
  plural: 'reports',
  abbr: 'R',
  namespaced: true,
};

export const ServiceModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Service',
  path: 'services',
  plural: 'services',
  abbr: 'S',
  namespaced: true,
  kind: 'Service',
  id: 'service',
  labelPlural: 'Services',
};

export const PodModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Pod',
  path: 'pods',
  plural: 'pods',
  abbr: 'P',
  namespaced: true,
  kind: 'Pod',
  id: 'pod',
  labelPlural: 'Pods',
};

export const ContainerModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Container',
  path: 'containers',
  plural: 'containers',
  abbr: 'C',
  kind: 'Container',
  id: 'container',
  labelPlural: 'Containers',
};

export const DaemonSetModel: K8sKind = {
  label: 'Daemon Set',
  path: 'daemonsets',
  apiGroup: 'apps',
  plural: 'daemonsets',
  apiVersion: 'v1',
  abbr: 'DS',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'DaemonSet',
  id: 'daemonset',
  labelPlural: 'Daemon Sets',
};

export const ReplicationControllerModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Replication Controller',
  path: 'replicationcontrollers',
  plural: 'replicationcontrollers',
  abbr: 'RC',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'ReplicationController',
  id: 'replicationcontroller',
  labelPlural: 'Replication Controllers',
};

export const HorizontalPodAutoscalerModel: K8sKind = {
  label: 'Horizontal Pod Autoscaler',
  path: 'horizontalpodautoscalers',
  plural: 'horizontalpodautoscalers',
  apiVersion: 'v2beta1',
  apiGroup: 'autoscaling',
  abbr: 'HPA',
  namespaced: true,
  kind: 'HorizontalPodAutoscaler',
  id: 'horizontalpodautoscaler',
  labelPlural: 'Horizontal Pod Autoscalers',
};

export const ServiceAccountModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Service Account',
  path: 'serviceaccounts',
  plural: 'serviceaccounts',
  abbr: 'SA',
  namespaced: true,
  kind: 'ServiceAccount',
  id: 'serviceaccount',
  labelPlural: 'Service Accounts',
};

export const ReplicaSetModel: K8sKind = {
  label: 'Replica Set',
  apiVersion: 'v1',
  path: 'replicasets',
  apiGroup: 'apps',
  plural: 'replicasets',
  abbr: 'RS',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'ReplicaSet',
  id: 'replicaset',
  labelPlural: 'Replica Sets',
};

export const DeploymentModel: K8sKind = {
  label: 'Deployment',
  apiVersion: 'v1',
  path: 'deployments',
  apiGroup: 'apps',
  plural: 'deployments',
  abbr: 'D',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Deployment',
  id: 'deployment',
  labelPlural: 'Deployments',
};

export const DeploymentConfigModel: K8sKind = {
  label: 'Deployment Config',
  apiVersion: 'v1',
  path: 'deploymentconfigs',
  apiGroup: 'apps.openshift.io',
  plural: 'deploymentconfigs',
  abbr: 'DC',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'DeploymentConfig',
  id: 'deploymentconfig',
  labelPlural: 'Deployment Configs',
};

export const BuildConfigModel: K8sKind = {
  label: 'Build Config',
  apiVersion: 'v1',
  path: 'buildconfigs',
  apiGroup: 'build.openshift.io',
  plural: 'buildconfigs',
  abbr: 'BC',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'BuildConfig',
  id: 'buildconfig',
  labelPlural: 'Build Configs',
};

export const BuildModel: K8sKind = {
  label: 'Build',
  apiVersion: 'v1',
  path: 'builds',
  apiGroup: 'build.openshift.io',
  plural: 'builds',
  abbr: 'B',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Build',
  id: 'build',
  labelPlural: 'Builds',
};

export const TemplateModel: K8sKind = {
  label: 'Template',
  apiVersion: 'v1',
  path: 'templates',
  apiGroup: 'template.openshift.io',
  plural: 'templates',
  abbr: 'T',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Template',
  id: 'template',
  labelPlural: 'Templates',
};

export const TemplateInstanceModel: K8sKind = {
  label: 'Template Instance',
  apiVersion: 'v1',
  path: 'templateinstances',
  apiGroup: 'template.openshift.io',
  plural: 'templateinstances',
  abbr: 'TI',
  namespaced: true,
  kind: 'TemplateInstance',
  id: 'templateinstance',
  labelPlural: 'Template Instances',
};

export const ImageStreamModel: K8sKind = {
  label: 'Image Stream',
  apiVersion: 'v1',
  path: 'imagestreams',
  apiGroup: 'image.openshift.io',
  plural: 'imagestreams',
  abbr: 'IS',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'ImageStream',
  id: 'imagestream',
  labelPlural: 'Image Streams',
};

export const ImageStreamTagModel: K8sKind = {
  label: 'Image Stream Tag',
  apiVersion: 'v1',
  path: 'imagestreamtags',
  apiGroup: 'image.openshift.io',
  plural: 'imagestreamtags',
  abbr: 'IST',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'ImageStreamTag',
  id: 'imagestreamtag',
  labelPlural: 'Image Stream Tags',
};

export const ImageStreamImportsModel: K8sKind = {
  label: 'Image Stream Import',
  apiVersion: 'v1',
  path: 'imagestreamimports',
  apiGroup: 'image.openshift.io',
  plural: 'imagestreamimports',
  abbr: 'ISI',
  namespaced: true,
  kind: 'ImageStreamImport',
  id: 'imagestreamimport',
  labelPlural: 'Image Stream Imports',
};

export const JobModel: K8sKind = {
  label: 'Job',
  apiVersion: 'v1',
  path: 'jobs',
  apiGroup: 'batch',
  plural: 'jobs',
  abbr: 'J',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Job',
  id: 'job',
  labelPlural: 'Jobs',
};

export const NodeModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Node',
  path: 'nodes',
  plural: 'nodes',
  abbr: 'N',
  kind: 'Node',
  id: 'node',
  labelPlural: 'Nodes',
};

export const EventModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Event',
  path: 'events',
  plural: 'events',
  abbr: 'E',
  namespaced: true,
  kind: 'Event',
  id: 'event',
  labelPlural: 'Events',
};

export const ComponentStatusModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Component Status',
  labelPlural: 'Component Statuses',
  path: 'componentstatuses',
  plural: 'componentstatuses',
  abbr: 'CS',
  kind: 'ComponentStatus',
  id: 'componentstatus',
};

export const NamespaceModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Namespace',
  path: 'namespaces',
  plural: 'namespaces',
  abbr: 'NS',
  kind: 'Namespace',
  id: 'namespace',
  labelPlural: 'Namespaces',
};

export const ProjectModel: K8sKind = {
  apiVersion: 'v1',
  apiGroup: 'project.openshift.io',
  label: 'Project',
  path: 'projects',
  plural: 'projects',
  abbr: 'PR',
  kind: 'Project',
  id: 'project',
  labelPlural: 'Projects',
};

export const ProjectRequestModel: K8sKind = {
  apiVersion: 'v1',
  apiGroup: 'project.openshift.io',
  label: 'Project Request',
  path: 'projectrequests',
  plural: 'projectrequests',
  abbr: '',
  kind: 'ProjectRequest',
  id: 'projectrequest',
  labelPlural: 'Project Requests',
};

export const IngressModel: K8sKind = {
  label: 'Ingress',
  labelPlural: 'Ingresses',
  apiGroup: 'extensions',
  apiVersion: 'v1beta1',
  path: 'ingresses',
  plural: 'ingresses',
  abbr: 'I',
  namespaced: true,
  kind: 'Ingress',
  id: 'ingress',
};

export const RouteModel: K8sKind = {
  label: 'Route',
  labelPlural: 'Routes',
  apiGroup: 'route.openshift.io',
  apiVersion: 'v1',
  path: 'routes',
  plural: 'routes',
  abbr: 'RT',
  namespaced: true,
  kind: 'Route',
  id: 'route',
};

export const ConfigMapModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Config Map',
  path: 'configmaps',
  plural: 'configmaps',
  abbr: 'CM',
  namespaced: true,
  kind: 'ConfigMap',
  id: 'configmap',
  labelPlural: 'Config Maps',
};

export const SecretModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Secret',
  path: 'secrets',
  plural: 'secrets',
  abbr: 'S',
  namespaced: true,
  kind: 'Secret',
  id: 'secret',
  labelPlural: 'Secrets',
};

export const ClusterRoleBindingModel: K8sKind = {
  label: 'Cluster Role Binding',
  apiGroup: 'rbac.authorization.k8s.io',
  apiVersion: 'v1',
  path: 'clusterrolebindings',
  plural: 'clusterrolebindings',
  abbr: 'CRB',
  kind: 'ClusterRoleBinding',
  id: 'clusterrolebinding',
  labelPlural: 'Cluster Role Bindings',
};

export const ClusterRoleModel: K8sKind = {
  label: 'Cluster Role',
  apiGroup: 'rbac.authorization.k8s.io',
  apiVersion: 'v1',
  path: 'clusterroles',
  plural: 'clusterroles',
  abbr: 'CR',
  kind: 'ClusterRole',
  id: 'clusterrole',
  labelPlural: 'Cluster Roles',
};

export const RoleBindingModel: K8sKind = {
  label: 'Role Binding',
  apiGroup: 'rbac.authorization.k8s.io',
  apiVersion: 'v1',
  path: 'rolebindings',
  plural: 'rolebindings',
  abbr: 'RB',
  namespaced: true,
  kind: 'RoleBinding',
  id: 'rolebinding',
  labelPlural: 'Role Bindings',
};

export const RoleModel: K8sKind = {
  label: 'Role',
  apiGroup: 'rbac.authorization.k8s.io',
  apiVersion: 'v1',
  path: 'roles',
  plural: 'roles',
  abbr: 'R',
  namespaced: true,
  kind: 'Role',
  id: 'role',
  labelPlural: 'Roles',
};

export const SelfSubjectAccessReviewModel: K8sKind = {
  label: 'SelfSubjectAccessReview',
  apiGroup: 'authorization.k8s.io',
  apiVersion: 'v1',
  path: 'selfsubjectaccessreviews',
  plural: 'selfsubjectaccessreviews',
  abbr: 'SSAR',
  namespaced: true,
  kind: 'SelfSubjectAccessReview',
  id: 'selfsubjectaccessreview',
  labelPlural: 'Self Subject Access Reviews',
};

export const PersistentVolumeModel: K8sKind = {
  label: 'Persistent Volume',
  apiVersion: 'v1',
  path: 'persistentvolumes',
  plural: 'persistentvolumes',
  abbr: 'PV',
  kind: 'PersistentVolume',
  id: 'persistentvolume',
  labelPlural: 'Persistent Volumes',
};

export const PersistentVolumeClaimModel: K8sKind = {
  label: 'Persistent Volume Claim',
  apiVersion: 'v1',
  path: 'persistentvolumeclaims',
  plural: 'persistentvolumeclaims',
  abbr: 'PVC',
  namespaced: true,
  kind: 'PersistentVolumeClaim',
  id: 'persistentvolumeclaim',
  labelPlural: 'Persistent Volume Claims',
};

export const PetsetModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Petset',
  plural: 'petsets',
  abbr: 'PS',
  path: 'petsets',
  propagationPolicy: 'Foreground',
  kind: 'Petset',
  id: 'petset',
  labelPlural: 'Petsets',
};

export const StatefulSetModel: K8sKind = {
  label: 'Stateful Set',
  apiGroup: 'apps',
  apiVersion: 'v1',
  path: 'statefulsets',
  plural: 'statefulsets',
  abbr: 'SS',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'StatefulSet',
  id: 'statefulset',
  labelPlural: 'Stateful Sets',
};

export const ResourceQuotaModel: K8sKind = {
  label: 'Resource Quota',
  apiVersion: 'v1',
  path: 'resourcequotas',
  plural: 'resourcequotas',
  abbr: 'RQ',
  namespaced: true,
  kind: 'ResourceQuota',
  id: 'resourcequota',
  labelPlural: 'Resource Quotas',
};

export const ClusterResourceQuotaModel: K8sKind = {
  label: 'Cluster Resource Quota',
  apiGroup: 'quota.openshift.io',
  apiVersion: 'v1',
  path: 'clusterresourcequotas',
  plural: 'clusterresourcequotas',
  abbr: 'CRQ',
  namespaced: false,
  kind: 'ClusterResourceQuota',
  id: 'clusterresourcequota',
  labelPlural: 'Cluster Resource Quotas',
};

export const NetworkPolicyModel: K8sKind = {
  label: 'Network Policy',
  labelPlural: 'Network Policies',
  apiVersion: 'v1',
  apiGroup: 'networking.k8s.io',
  path: 'networkpolicies',
  plural: 'networkpolicies',
  abbr: 'NP',
  namespaced: true,
  kind: 'NetworkPolicy',
  id: 'networkpolicy',
};

export const CustomResourceDefinitionModel: K8sKind = {
  label: 'Custom Resource Definition',
  apiGroup: 'apiextensions.k8s.io',
  apiVersion: 'v1beta1',
  path: 'customresourcedefinitions',
  abbr: 'CRD',
  namespaced: false,
  plural: 'customresourcedefinitions',
  kind: 'CustomResourceDefinition',
  id: 'customresourcedefinition',
  labelPlural: 'Custom Resource Definitions',
};

export const CronJobModel: K8sKind = {
  label: 'Cron Job',
  apiVersion: 'v1beta1',
  path: 'cronjobs',
  apiGroup: 'batch',
  plural: 'cronjobs',
  abbr: 'CJ',
  namespaced: true,
  kind: 'CronJob',
  id: 'cronjob',
  labelPlural: 'Cron Jobs',
  propagationPolicy : 'Foreground',
};

export const StorageClassModel: K8sKind = {
  label: 'Storage Class',
  labelPlural: 'Storage Classes',
  apiVersion: 'v1',
  path: 'storageclasses',
  apiGroup: 'storage.k8s.io',
  plural: 'storageclasses',
  abbr: 'SC',
  namespaced: false,
  kind: 'StorageClass',
  id: 'storageclass',
};

export const ClusterServiceBrokerModel: K8sKind = {
  label: 'Cluster Service Broker',
  labelPlural: 'Cluster Service Brokers',
  apiVersion: 'v1beta1',
  path: 'clusterservicebrokers',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterservicebrokers',
  abbr: 'CSB',
  namespaced: false,
  kind: 'ClusterServiceBroker',
  id: 'clusterservicebroker',
  crd: true,
};

export const ClusterServiceClassModel: K8sKind = {
  label: 'Cluster Service Class',
  labelPlural: 'Cluster Service Classes',
  apiVersion: 'v1beta1',
  path: 'clusterserviceclasses',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterserviceclasses',
  abbr: 'CSC',
  namespaced: false,
  kind: 'ClusterServiceClass',
  id: 'clusterserviceclass',
  crd: true,
};

export const ClusterServicePlanModel: K8sKind = {
  label: 'Cluster Service Plan',
  labelPlural: 'Cluster Service Plans',
  apiVersion: 'v1beta1',
  path: 'clusterserviceplans',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterserviceplans',
  abbr: 'CSP',
  namespaced: false,
  kind: 'ClusterServicePlan',
  id: 'clusterserviceplan',
  crd: true,
};

export const ServiceInstanceModel: K8sKind = {
  label: 'Service Instance',
  labelPlural: 'Service Instances',
  apiVersion: 'v1beta1',
  path: 'serviceinstances',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'serviceinstances',
  abbr: 'SI',
  namespaced: true,
  kind: 'ServiceInstance',
  id: 'serviceinstance',
  crd: true,
};

export const ServiceBindingModel: K8sKind = {
  label: 'Service Binding',
  labelPlural: 'Service Bindings',
  apiVersion: 'v1beta1',
  path: 'servicebindings',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'servicebindings',
  abbr: 'SB',
  namespaced: true,
  kind: 'ServiceBinding',
  id: 'servicebinding',
  crd: true,
};

export const LimitRangeModel: K8sKind = {
  label: 'Limit Range',
  apiVersion: 'v1',
  path: 'limitranges',
  plural: 'limitranges',
  abbr: 'LR',
  namespaced: true,
  kind: 'LimitRange',
  id: 'limitrange',
  labelPlural: 'Limit Ranges',
};

export const APIServiceModel: K8sKind = {
  label: 'API Service',
  labelPlural: 'API Services',
  apiVersion: 'v1',
  path: 'apiservices',
  apiGroup: 'apiregistration.k8s.io',
  plural: 'apiservices',
  abbr: 'APIS',
  namespaced: false,
  kind: 'APIService',
  id: 'apiservice',
  crd: true,
};

// Cluster API resources
// https://github.com/openshift/cluster-api
export const MachineModel: K8sKind = {
  label: 'Machine',
  labelPlural: 'Machines',
  apiVersion: 'v1beta1',
  path: 'machines',
  apiGroup: 'machine.openshift.io',
  plural: 'machines',
  abbr: 'M',
  namespaced: true,
  kind: 'Machine',
  id: 'machine',
  crd: true,
};

export const MachineSetModel: K8sKind = {
  label: 'Machine Set',
  labelPlural: 'Machine Sets',
  apiVersion: 'v1beta1',
  path: 'machinesets',
  apiGroup: 'machine.openshift.io',
  plural: 'machinesets',
  abbr: 'MS',
  namespaced: true,
  kind: 'MachineSet',
  id: 'machineset',
  crd: true,
};

export const MachineDeploymentModel: K8sKind = {
  label: 'Machine Deployment',
  labelPlural: 'Machine Deployments',
  apiVersion: 'v1beta1',
  path: 'machinedeployments',
  apiGroup: 'machine.openshift.io',
  plural: 'machinedeployments',
  abbr: 'MD',
  namespaced: true,
  kind: 'MachineDeployment',
  id: 'machinedeployment',
  crd: true,
};

export const MachineConfigPoolModel: K8sKind = {
  label: 'Machine Config Pool',
  labelPlural: 'Machine Config Pools',
  apiVersion: 'v1',
  path: 'machineconfigpools',
  apiGroup: 'machineconfiguration.openshift.io',
  plural: 'machineconfigpools',
  abbr: 'MCP',
  namespaced: false,
  kind: 'MachineConfigPool',
  id: 'machineconfigpool',
  crd: true,
};

export const MachineConfigModel: K8sKind = {
  label: 'Machine Config',
  labelPlural: 'Machine Configs',
  apiVersion: 'v1',
  path: 'machineconfigs',
  apiGroup: 'machineconfiguration.openshift.io',
  plural: 'machineconfigs',
  abbr: 'MC',
  namespaced: false,
  kind: 'MachineConfig',
  id: 'machineconfigpool',
  crd: true,
};

export const MachineAutoscalerModel: K8sKind = {
  label: 'Machine Autoscaler',
  labelPlural: 'Machine Autoscalers',
  apiVersion: 'v1beta1',
  path: 'machineautoscalers',
  apiGroup: 'autoscaling.openshift.io',
  plural: 'machineautoscalers',
  abbr: 'MA',
  namespaced: true,
  kind: 'MachineAutoscaler',
  id: 'machineautoscaler',
  crd: true,
};

// Openshift cluster resources
export const ClusterOperatorModel: K8sKind = {
  label: 'Cluster Operator',
  labelPlural: 'Cluster Operators',
  apiVersion: 'v1',
  path: 'clusteroperators',
  apiGroup: 'config.openshift.io',
  plural: 'clusteroperators',
  abbr: 'CO',
  namespaced: false,
  kind: 'ClusterOperator',
  id: 'clusteroperator',
  crd: true,
};

export const ClusterVersionModel: K8sKind = {
  label: 'Cluster Version',
  labelPlural: 'Cluster Versions',
  apiVersion: 'v1',
  path: 'clusterversions',
  apiGroup: 'config.openshift.io',
  plural: 'clusterversions',
  abbr: 'CV',
  namespaced: false,
  kind: 'ClusterVersion',
  id: 'clusterversion',
  crd: true,
};

export const ClusterAutoscalerModel: K8sKind = {
  label: 'Cluster Autoscaler',
  labelPlural: 'Cluster Autoscalers',
  apiVersion: 'v1',
  path: 'clusterautoscalers',
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
  labelPlural: 'OAuths',
  apiVersion: 'v1',
  path: 'oauths',
  apiGroup: 'config.openshift.io',
  plural: 'oauths',
  abbr: 'OA',
  namespaced: false,
  kind: 'OAuth',
  id: 'oauth',
  crd: true,
};
