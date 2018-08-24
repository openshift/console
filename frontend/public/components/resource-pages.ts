/* eslint-disable no-unused-vars */

import { Map as ImmutableMap } from 'immutable';

import { ReportReference, ReportGenerationQueryReference } from './chargeback';
import { referenceForModel, GroupVersionKind } from '../module/k8s';
import {
  ClusterModel,
  ConfigMapModel,
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  BuildConfigModel,
  BuildModel,
  ImageStreamModel,
  JobModel,
  CronJobModel,
  ProjectModel,
  NamespaceModel,
  NetworkPolicyModel,
  NodeModel,
  PodModel,
  ReplicaSetModel,
  ReplicationControllerModel,
  SecretModel,
  ServiceAccountModel,
  ServiceModel,
  IngressModel,
  RouteModel,
  RoleModel,
  RoleBindingModel,
  PrometheusModel,
  ServiceMonitorModel,
  AlertmanagerModel,
  StatefulSetModel,
  ResourceQuotaModel,
  LimitRangeModel,
  HorizontalPodAutoscalerModel,
  PersistentVolumeModel,
  PersistentVolumeClaimModel,
  StorageClassModel,
  CustomResourceDefinitionModel,
  ClusterServiceVersionModel,
  SubscriptionModel,
  InstallPlanModel,
  ImageStreamTagModel,
  ClusterRoleModel,
  ContainerModel,
  CatalogSourceModel,
  ServiceInstanceModel,
  ServiceBindingModel,
  ClusterServiceClassModel,
  ClusterServiceBrokerModel,
  ClusterServicePlanModel
} from '../models';

export const resourceDetailPages = ImmutableMap<GroupVersionKind | string, () => Promise<React.ComponentType<any>>>()
  .set(referenceForModel(ClusterModel), () => import('./clusters' /* webpackChunkName: "clusters" */).then(m => m.ClustersPage))
  .set(referenceForModel(ClusterServiceClassModel), () => import('./cluster-service-class' /* webpackChunkName: "cluster-service-class" */).then(m => m.ClusterServiceClassDetailsPage))
  .set(referenceForModel(ClusterServiceBrokerModel), () => import('./cluster-service-broker' /* webpackChunkName: "cluster-service-broker" */).then(m => m.ClusterServiceBrokerDetailsPage))
  .set(referenceForModel(ClusterServicePlanModel), () => import('./cluster-service-plan' /* webpackChunkName: "cluster-service-plan" */).then(m => m.ClusterServicePlanDetailsPage))
  .set(referenceForModel(ConfigMapModel), () => import('./configmap' /* webpackChunkName: "configmap" */).then(m => m.ConfigMapsDetailsPage))
  .set(referenceForModel(ContainerModel), () => import('./container' /* webpackChunkName: "container" */).then(m => m.ContainersDetailsPage))
  .set(referenceForModel(DaemonSetModel), () => import('./daemonset' /* webpackChunkName: "daemonset" */).then(m => m.DaemonSetsDetailsPage))
  .set(referenceForModel(DeploymentConfigModel), () => import('./deployment-config' /* webpackChunkName: "deployment-config" */).then(m => m.DeploymentConfigsDetailsPage))
  .set(referenceForModel(DeploymentModel), () => import('./deployment' /* webpackChunkName: "deployment" */).then(m => m.DeploymentsDetailsPage))
  .set(referenceForModel(BuildConfigModel), () => import('./build-config' /* webpackChunkName: "build-config" */).then(m => m.BuildConfigsDetailsPage))
  .set(referenceForModel(BuildModel), () => import('./build' /* webpackChunkName: "build" */).then(m => m.BuildsDetailsPage))
  .set(referenceForModel(ImageStreamModel), () => import('./image-stream' /* webpackChunkName: "image-stream" */).then(m => m.ImageStreamsDetailsPage))
  .set(referenceForModel(ImageStreamTagModel), () => import('./image-stream-tag' /* webpackChunkName: "image-stream-tag" */).then(m => m.ImageStreamTagsDetailsPage))
  .set(referenceForModel(JobModel), () => import('./job' /* webpackChunkName: "job" */).then(m => m.JobsDetailsPage))
  .set(referenceForModel(CronJobModel), () => import('./cron-job' /* webpackChunkName: "cron-job" */).then(m => m.CronJobsDetailsPage))
  .set(referenceForModel(ProjectModel), () => import('./namespace' /* webpackChunkName: "namespace" */).then(m => m.ProjectsDetailsPage))
  .set(referenceForModel(NamespaceModel), () => import('./namespace' /* webpackChunkName: "namespace" */).then(m => m.NamespacesDetailsPage))
  .set(referenceForModel(NetworkPolicyModel), () => import('./network-policy' /* webpackChunkName: "network-policy" */).then(m => m.NetworkPoliciesDetailsPage))
  .set(referenceForModel(NodeModel), () => import('./node' /* webpackChunkName: "node" */).then(m => m.NodesDetailsPage))
  .set(referenceForModel(PodModel), () => import('./pod' /* webpackChunkName: "pod" */).then(m => m.PodsDetailsPage))
  .set(referenceForModel(ReplicaSetModel), () => import('./replicaset' /* webpackChunkName: "replicaset" */).then(m => m.ReplicaSetsDetailsPage))
  .set(referenceForModel(ReplicationControllerModel), () => import('./replication-controller' /* webpackChunkName: "replication-controller" */).then(m => m.ReplicationControllersDetailsPage))
  .set(referenceForModel(SecretModel), () => import('./secret' /* webpackChunkName: "secret" */).then(m => m.SecretsDetailsPage))
  .set(referenceForModel(ServiceAccountModel), () => import('./service-account' /* webpackChunkName: "service-account" */).then(m => m.ServiceAccountsDetailsPage))
  .set(referenceForModel(ServiceInstanceModel), () => import('./service-instance' /* webpackChunkName: "service-instance" */).then(m => m.ServiceInstanceDetailsPage))
  .set(referenceForModel(ServiceBindingModel), () => import('./service-binding' /* webpackChunkName: "service-binding" */).then(m => m.ServiceBindingDetailsPage))
  .set(referenceForModel(ServiceModel), () => import('./service' /* webpackChunkName: "service" */).then(m => m.ServicesDetailsPage))
  .set(referenceForModel(IngressModel), () => import('./ingress' /* webpackChunkName: "ingress" */).then(m => m.IngressesDetailsPage))
  .set(referenceForModel(RouteModel), () => import('./routes' /* webpackChunkName: "routes" */).then(m => m.RoutesDetailsPage))
  .set(referenceForModel(ClusterRoleModel), () => import('./RBAC/role' /* webpackChunkName: "role" */).then(m => m.ClusterRolesDetailsPage))
  .set(referenceForModel(RoleModel), () => import('./RBAC/role' /* webpackChunkName: "role" */).then(m => m.RolesDetailsPage))
  .set(referenceForModel(AlertmanagerModel), () => import('./alert-manager' /* webpackChunkName: "alert-manager" */).then(m => m.AlertManagersDetailsPage))
  .set(referenceForModel(StatefulSetModel), () => import('./stateful-set' /* webpackChunkName: "stateful-set" */).then(m => m.StatefulSetsDetailsPage))
  .set(referenceForModel(ResourceQuotaModel), () => import('./resource-quota' /* webpackChunkName: "resource-quota" */).then(m => m.ResourceQuotasDetailsPage))
  .set(referenceForModel(LimitRangeModel), () => import('./limit-range' /* webpackChunkName: "limit-range" */).then(m => m.LimitRangeDetailsPage))
  .set(referenceForModel(HorizontalPodAutoscalerModel), () => import('./hpa' /* webpackChunkName: "hpa" */).then(m => m.HorizontalPodAutoscalersDetailsPage))
  .set(referenceForModel(PersistentVolumeModel), () => import('./persistent-volume' /* webpackChunkName: "persistent-volume" */).then(m => m.PersistentVolumesDetailsPage))
  .set(referenceForModel(PersistentVolumeClaimModel), () => import('./persistent-volume-claim' /* webpackChunkName: "persistent-volume-claim" */).then(m => m.PersistentVolumeClaimsDetailsPage))
  .set(ReportReference, () => import('./chargeback' /* webpackChunkName: "chargeback" */).then(m => m.ReportsDetailsPage))
  .set(ReportGenerationQueryReference, () => import('./chargeback' /* webpackChunkName: "chargeback" */).then(m => m.ReportGenerationQueriesDetailsPage))
  .set(referenceForModel(StorageClassModel), () => import('./storage-class' /* webpackChunkName: "storage-class" */).then(m => m.StorageClassDetailsPage))
  .set(referenceForModel(ClusterServiceVersionModel), () => import('./cloud-services/clusterserviceversion' /* webpackChunkName: "clusterserviceversion" */).then(m => m.ClusterServiceVersionsDetailsPage))
  .set(referenceForModel(CatalogSourceModel), () => import('./cloud-services/catalog-source' /* webpackChunkName: "catalog-source" */).then(m => m.CatalogSourceDetailsPage))
  .set(referenceForModel(SubscriptionModel), () => import('./cloud-services/subscription' /* webpackChunkName: "subscription" */).then(m => m.SubscriptionDetailsPage))
  .set(referenceForModel(InstallPlanModel), () => import('./cloud-services/install-plan' /* webpackChunkName: "install-plan" */).then(m => m.InstallPlanDetailsPage));

export const resourceListPages = ImmutableMap<GroupVersionKind | string, () => Promise<React.ComponentType<any>>>()
  .set(referenceForModel(ClusterModel), () => import('./clusters' /* webpackChunkName: "clusters" */).then(m => m.ClustersPage))
  .set(referenceForModel(ClusterServiceClassModel), () => import('./cluster-service-class' /* webpackChunkName: "cluster-service-class" */).then(m => m.ClusterServiceClassPage))
  .set(referenceForModel(ClusterServiceBrokerModel), () => import('./cluster-service-broker' /* webpackChunkName: "cluster-service-broker" */).then(m => m.ClusterServiceBrokerPage))
  .set(referenceForModel(ClusterServicePlanModel), () => import('./cluster-service-plan' /* webpackChunkName: "cluster-service-plan" */).then(m => m.ClusterServicePlanPage))
  .set(referenceForModel(ConfigMapModel), () => import('./configmap' /* webpackChunkName: "configmap" */).then(m => m.ConfigMapsPage))
  .set(referenceForModel(DaemonSetModel), () => import('./daemonset' /* webpackChunkName: "daemonset" */).then(m => m.DaemonSetsPage))
  .set(referenceForModel(DeploymentConfigModel), () => import('./deployment-config' /* webpackChunkName: "deployment-config" */).then(m => m.DeploymentConfigsPage))
  .set(referenceForModel(DeploymentModel), () => import('./deployment' /* webpackChunkName: "deployment" */).then(m => m.DeploymentsPage))
  .set(referenceForModel(BuildConfigModel), () => import('./build-config' /* webpackChunkName: "build-config" */).then(m => m.BuildConfigsPage))
  .set(referenceForModel(BuildModel), () => import('./build' /* webpackChunkName: "build" */).then(m => m.BuildsPage))
  .set(referenceForModel(ImageStreamModel), () => import('./image-stream' /* webpackChunkName: "image-stream" */).then(m => m.ImageStreamsPage))
  .set(referenceForModel(JobModel), () => import('./job' /* webpackChunkName: "job" */).then(m => m.JobsPage))
  .set(referenceForModel(CronJobModel), () => import('./cron-job' /* webpackChunkName: "cron-job" */).then(m => m.CronJobsPage))
  .set(referenceForModel(ProjectModel), () => import('./namespace' /* webpackChunkName: "namespace" */).then(m => m.ProjectsPage))
  .set(referenceForModel(NamespaceModel), () => import('./namespace' /* webpackChunkName: "namespace" */).then(m => m.NamespacesPage))
  .set(referenceForModel(NetworkPolicyModel), () => import('./network-policy' /* webpackChunkName: "network-policy" */).then(m => m.NetworkPoliciesPage))
  .set(referenceForModel(NodeModel), () => import('./node' /* webpackChunkName: "node" */).then(m => m.NodesPage))
  .set(referenceForModel(PodModel), () => import('./pod' /* webpackChunkName: "pod" */).then(m => m.PodsPage))
  .set(referenceForModel(ReplicaSetModel), () => import('./replicaset' /* webpackChunkName: "replicaset" */).then(m => m.ReplicaSetsPage))
  .set(referenceForModel(ReplicationControllerModel), () => import('./replication-controller' /* webpackChunkName: "replication-controller" */).then(m => m.ReplicationControllersPage))
  .set(referenceForModel(SecretModel), () => import('./secret' /* webpackChunkName: "secret" */).then(m => m.SecretsPage))
  .set(referenceForModel(ServiceAccountModel), () => import('./service-account' /* webpackChunkName: "service-account" */).then(m => m.ServiceAccountsPage))
  .set(referenceForModel(ServiceInstanceModel), () => import('./service-instance' /* webpackChunkName: "service-instance" */).then(m => m.ServiceInstancesPage))
  .set(referenceForModel(ServiceBindingModel), () => import('./service-binding' /* webpackChunkName: "service-binding" */).then(m => m.ServiceBindingsPage))
  .set(referenceForModel(ServiceModel), () => import('./service' /* webpackChunkName: "service" */).then(m => m.ServicesPage))
  .set(referenceForModel(IngressModel), () => import('./ingress' /* webpackChunkName: "ingress" */).then(m => m.IngressesPage))
  .set(referenceForModel(RouteModel), () => import('./routes' /* webpackChunkName: "routes" */).then(m => m.RoutesPage))
  .set(referenceForModel(RoleModel), () => import('./RBAC/role' /* webpackChunkName: "role" */).then(m => m.RolesPage))
  .set(referenceForModel(RoleBindingModel), () => import('./RBAC/bindings' /* webpackChunkName: "bindings" */).then(m => m.RoleBindingsPage))
  .set(referenceForModel(PrometheusModel), () => import('./prometheus' /* webpackChunkName: "prometheus" */).then(m => m.PrometheusInstancesPage))
  .set(referenceForModel(ServiceMonitorModel), () => import('./service-monitor' /* webpackChunkName: "service-monitor" */).then(m => m.ServiceMonitorsPage))
  .set(referenceForModel(AlertmanagerModel), () => import('./alert-manager' /* webpackChunkName: "alert-manager" */).then(m => m.AlertManagersPage))
  .set(referenceForModel(StatefulSetModel), () => import('./stateful-set' /* webpackChunkName: "stateful-set" */).then(m => m.StatefulSetsPage))
  .set(referenceForModel(ResourceQuotaModel), () => import('./resource-quota' /* webpackChunkName: "resource-quota" */).then(m => m.ResourceQuotasPage))
  .set(referenceForModel(LimitRangeModel), () => import('./limit-range' /* webpackChunkName: "limit-range" */).then(m => m.LimitRangeListPage))
  .set(referenceForModel(HorizontalPodAutoscalerModel), () => import('./hpa' /* webpackChunkName: "hpa" */).then(m => m.HorizontalPodAutoscalersPage))
  .set(referenceForModel(PersistentVolumeModel), () => import('./persistent-volume' /* webpackChunkName: "persistent-volume" */).then(m => m.PersistentVolumesPage))
  .set(referenceForModel(PersistentVolumeClaimModel), () => import('./persistent-volume-claim' /* webpackChunkName: "persistent-volume-claim" */).then(m => m.PersistentVolumeClaimsPage))
  .set(ReportReference, () => import('./chargeback' /* webpackChunkName: "chargeback" */).then(m => m.ReportsPage))
  .set(ReportGenerationQueryReference, () => import('./chargeback' /* webpackChunkName: "chargeback" */).then(m => m.ReportGenerationQueriesPage))
  .set(referenceForModel(StorageClassModel), () => import('./storage-class' /* webpackChunkName: "storage-class" */).then(m => m.StorageClassPage))
  .set(referenceForModel(CustomResourceDefinitionModel), () => import('./custom-resource-definition' /* webpackChunkName: "custom-resource-definition" */).then(m => m.CustomResourceDefinitionsPage))
  .set(referenceForModel(ClusterServiceVersionModel), () => import('./cloud-services/clusterserviceversion' /* webpackChunkName: "clusterserviceversion" */).then(m => m.ClusterServiceVersionsPage))
  .set(referenceForModel(CatalogSourceModel), () => import('./cloud-services/catalog-source' /* webpackChunkName: "catalog-source" */).then(m => m.CatalogSourcesPage))
  .set(referenceForModel(SubscriptionModel), () => import('./cloud-services/subscription' /* webpackChunkName: "subscription" */).then(m => m.SubscriptionsPage))
  .set(referenceForModel(InstallPlanModel), () => import('./cloud-services/install-plan' /* webpackChunkName: "install-plan" */).then(m => m.InstallPlansPage));
