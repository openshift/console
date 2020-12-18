import { Map as ImmutableMap } from 'immutable';
import { referenceForModel, GroupVersionKind } from '../../module/k8s';
import { ApprovalModel, HyperClusterResourceModel, FederatedConfigMapModel,FederatedDeploymentModel, FederatedIngressModel, FederatedNamespaceModel, FederatedJobModel, FederatedReplicaSetModel, FederatedSecretModel, FederatedServiceModel, FederatedPodModel, FederatedHPAModel, FederatedDaemonSetModel, FederatedStatefulSetModel, FederatedCronJobModel } from '../../models';

type ResourceMapKey = GroupVersionKind | string;
type ResourceMapValue = () => Promise<React.ComponentType<any>>;

export const hyperCloudDetailsPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ApprovalModel), () => import('./approval' /* webpackChunkName: "approval" */).then(m => m.ApprovalsDetailsPage))
  .set(referenceForModel(HyperClusterResourceModel), () => import('./cluster' /* webpackChunkName: "cluster" */).then(m => m.ClustersDetailsPage))
  .set(referenceForModel(FederatedConfigMapModel), () => import('./federated-config-map' /* webpackChunkName: "configmap" */).then(m => m.FederatedConfigMapsDetailsPage))
  .set(referenceForModel(FederatedDeploymentModel), () => import('./federated-deployment' /* webpackChunkName: "deployment" */).then(m => m.FederatedDeploymentsDetailsPage))
  .set(referenceForModel(FederatedIngressModel), () => import('./federated-ingress' /* webpackChunkName: "ingress" */).then(m => m.FederatedIngressesDetailsPage))
  .set(referenceForModel(FederatedNamespaceModel), () => import('./federated-namespace' /* webpackChunkName: "namespace" */).then(m => m.FederatedNamespacesDetailsPage))
  .set(referenceForModel(FederatedJobModel), () => import('./federated-job' /* webpackChunkName: "job" */).then(m => m.FederatedJobsDetailsPage))
  .set(referenceForModel(FederatedReplicaSetModel), () => import('./federated-replica-set' /* webpackChunkName: "replica-set" */).then(m => m.FederatedReplicaSetsDetailsPage))
  .set(referenceForModel(FederatedSecretModel), () => import('./federated-secret' /* webpackChunkName: "secret" */).then(m => m.FederatedSecretsDetailsPage))
  .set(referenceForModel(FederatedServiceModel), () => import('./federated-service' /* webpackChunkName: "service" */).then(m => m.FederatedServicesDetailsPage))
  .set(referenceForModel(FederatedPodModel), () => import('./federated-pod' /* webpackChunkName: "pod" */).then((m) => m.FederatedPodsDetailsPage))
  .set(referenceForModel(FederatedHPAModel), () => import('./federated-horizontalpodautoscaler' /* webpackChunkName: "horizontalpodautoscaler" */).then((m) => m.FederatedHPAsDetailsPage))
  .set(referenceForModel(FederatedDaemonSetModel), () => import('./federated-daemonset' /* webpackChunkName: "daemonset" */).then((m) => m.FederatedDaemonSetsDetailsPage))
  .set(referenceForModel(FederatedStatefulSetModel), () => import('./federated-statefulset' /* webpackChunkName: "statefulset" */).then((m) => m.FederatedStatefulSetsDetailsPage))
  .set(referenceForModel(FederatedCronJobModel), () => import('./federated-cronjob' /* webpackChunkName: "cronjob" */).then((m) => m.FederatedCronJobsDetailsPage));

export const hyperCloudListPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ApprovalModel), () => import('./approval' /* webpackChunkName: "approval" */).then(m => m.ApprovalsPage))
  .set(referenceForModel(HyperClusterResourceModel), () => import('./cluster' /* webpackChunkName: "cluster" */).then(m => m.ClustersPage))
  .set(referenceForModel(FederatedConfigMapModel), () => import('./federated-config-map' /* webpackChunkName: "configmap" */).then(m => m.FederatedConfigMapsPage))
  .set(referenceForModel(FederatedDeploymentModel), () => import('./federated-deployment' /* webpackChunkName: "deployment" */).then(m => m.FederatedDeploymentsPage))
  .set(referenceForModel(FederatedIngressModel), () => import('./federated-ingress' /* webpackChunkName: "ingress" */).then(m => m.FederatedIngressesPage))
  .set(referenceForModel(FederatedNamespaceModel), () => import('./federated-namespace' /* webpackChunkName: "namespace" */).then(m => m.FederatedNamespacesPage))
  .set(referenceForModel(FederatedJobModel), () => import('./federated-job' /* webpackChunkName: "job" */).then(m => m.FederatedJobsPage))
  .set(referenceForModel(FederatedReplicaSetModel), () => import('./federated-replica-set' /* webpackChunkName: "replica-set" */).then(m => m.FederatedReplicaSetsPage))
  .set(referenceForModel(FederatedSecretModel), () => import('./federated-secret' /* webpackChunkName: "secret" */).then(m => m.FederatedSecretsPage))
  .set(referenceForModel(FederatedServiceModel), () => import('./federated-service' /* webpackChunkName: "service" */).then(m => m.FederatedServicesPage))
  .set(referenceForModel(FederatedPodModel), () => import('./federated-pod' /* webpackChunkName: "pod" */).then(m => m.FederatedPodsPage))
  .set(referenceForModel(FederatedHPAModel), () => import('./federated-horizontalpodautoscaler' /* webpackChunkName: "horizontalpodautoscaler" */).then((m) => m.FederatedHPAsPage))
  .set(referenceForModel(FederatedDaemonSetModel), () => import('./federated-daemonset' /* webpackChunkName: "daemonset" */).then((m) => m.FederatedDaemonSetsPage))
  .set(referenceForModel(FederatedStatefulSetModel), () => import('./federated-statefulset' /* webpackChunkName: "statefulset" */).then((m) => m.FederatedStatefulSetsPage))
  .set(referenceForModel(FederatedCronJobModel), () => import('./federated-cronjob' /* webpackChunkName: "cronjob" */).then((m) => m.FederatedCronJobsPage));