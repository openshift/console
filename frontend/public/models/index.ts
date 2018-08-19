// eslint-disable-next-line no-unused-vars
import { K8sKind } from '../module/k8s';

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

export const EtcdClusterModel: K8sKind = {
  kind: 'EtcdCluster',
  label: 'etcd Cluster',
  labelPlural: 'Etcd Clusters',
  apiGroup: 'etcd.database.coreos.com',
  apiVersion: 'v1beta2',
  path: 'etcdclusters',
  abbr: 'EC',
  namespaced: true,
  crd: true,
  plural: 'etcdclusters',
  propagationPolicy : 'Foreground',
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

export const ClusterModel: K8sKind = {
  kind: 'Cluster',
  label: 'Cluster',
  labelPlural: 'Clusters',
  apiGroup: 'multicluster.coreos.com',
  path: 'clusters',
  apiVersion: 'v1',
  crd: true,
  plural: 'clusters',
  abbr: 'C',
  namespaced: false,
};

export const ChargebackReportModel: K8sKind = {
  kind: 'Report',
  label: 'Report',
  labelPlural: 'Reports',
  apiGroup: 'chargeback.coreos.com',
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
  labelPlural: 'Services'
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
  labelPlural: 'Pods'
};

export const ContainerModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Container',
  path: 'containers',
  plural: 'containers',
  abbr: 'C',
  kind: 'Container',
  id: 'container',
  labelPlural: 'Containers'
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
  labelPlural: 'Daemon Sets'
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
  labelPlural: 'Replication Controllers'
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
  labelPlural: 'Horizontal Pod Autoscalers'
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
  labelPlural: 'Service Accounts'
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
  labelPlural: 'Replica Sets'
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
  labelPlural: 'Deployments'
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
  labelPlural: 'Deployment Configs'
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
  labelPlural: 'Build Configs'
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
  labelPlural: 'Builds'
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
  labelPlural: 'Image Streams'
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
  labelPlural: 'Image Stream Tags'
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
  labelPlural: 'Jobs'
};

export const NodeModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Node',
  path: 'nodes',
  plural: 'nodes',
  abbr: 'N',
  kind: 'Node',
  id: 'node',
  labelPlural: 'Nodes'
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
  labelPlural: 'Events'
};

export const ComponentStatusModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Component Status',
  labelPlural: 'Component Statuses',
  path: 'componentstatuses',
  plural: 'componentstatuses',
  abbr: 'CS',
  kind: 'ComponentStatus',
  id: 'componentstatus'
};

export const NamespaceModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Namespace',
  path: 'namespaces',
  plural: 'namespaces',
  abbr: 'NS',
  kind: 'Namespace',
  id: 'namespace',
  labelPlural: 'Namespaces'
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
  labelPlural: 'Projects'
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
  labelPlural: 'Project Requests'
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
  id: 'ingress'
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
  id: 'route'
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
  labelPlural: 'Config Maps'
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
  labelPlural: 'Secrets'
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
  labelPlural: 'Cluster Role Bindings'
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
  labelPlural: 'Cluster Roles'
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
  labelPlural: 'Role Bindings'
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
  labelPlural: 'Roles'
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
  labelPlural: 'Self Subject Access Reviews'
};

export const TectonicVersionModel: K8sKind = {
  label: 'Tectonic Version',
  apiGroup: 'tco.coreos.com',
  apiVersion: 'v1',
  path: 'tectonicversions',
  plural: 'tectonicversions',
  abbr: 'TV',
  namespaced: true,
  kind: 'TectonicVersion',
  id: 'tectonicversion',
  labelPlural: 'Tectonic Versions'
};

export const ChannelOperatorConfigModel: K8sKind = {
  label: 'Channel Operator Config',
  apiGroup: 'tco.coreos.com',
  apiVersion: 'v1',
  path: 'channeloperatorconfigs',
  plural: 'channeloperatorconfigs',
  abbr: 'COC',
  namespaced: true,
  kind: 'ChannelOperatorConfig',
  id: 'channeloperatorconfig',
  labelPlural: 'Channel Operator Configs'
};

export const AppVersionModel: K8sKind = {
  label: 'AppVersion',
  apiGroup: 'tco.coreos.com',
  apiVersion: 'v1',
  path: 'appversions',
  plural: 'appversions',
  abbr: 'AV',
  namespaced: true,
  kind: 'AppVersion',
  id: 'appversion',
  labelPlural: 'AppVersions'
};

export const PersistentVolumeModel: K8sKind = {
  label: 'Persistent Volume',
  apiVersion: 'v1',
  path: 'persistentvolumes',
  plural: 'persistentvolumes',
  abbr: 'PV',
  kind: 'PersistentVolume',
  id: 'persistentvolume',
  labelPlural: 'Persistent Volumes'
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
  labelPlural: 'Persistent Volume Claims'
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
  labelPlural: 'Petsets'
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
  labelPlural: 'Stateful Sets'
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
  labelPlural: 'Resource Quotas'
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
  id: 'networkpolicy'
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
  labelPlural: 'Custom Resource Definitions'
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
  id: 'storageclass'
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
  id: 'clusterservicebroker'
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
  id: 'clusterserviceclass'
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
  id: 'clusterserviceplan'
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
  id: 'serviceinstance'
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
  id: 'servicebinding'
};
