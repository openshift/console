import { Map as ImmutableMap } from 'immutable';
import { referenceForModel, GroupVersionKind } from '../../module/k8s';
import {
  PodSecurityPolicyModel,
  NamespaceClaimModel,
  ResourceQuotaClaimModel,
  RoleBindingClaimModel,
  HyperClusterResourceModel,
  FederatedConfigMapModel,
  FederatedDeploymentModel,
  FederatedIngressModel,
  FederatedNamespaceModel,
  FederatedJobModel,
  FederatedReplicaSetModel,
  FederatedSecretModel,
  FederatedServiceModel,
  FederatedPodModel,
  FederatedHPAModel,
  FederatedDaemonSetModel,
  FederatedStatefulSetModel,
  FederatedCronJobModel,
  VirtualMachineModel,
  VirtualMachineInstanceModel,
  VirtualServiceModel,
  DestinationRuleModel,
  EnvoyFilterModel,
  GatewayModel,
  SidecarModel,
  ServiceEntryModel,
  RequestAuthenticationModel,
  PeerAuthenticationModel,
  AuthorizationPolicyModel,
  DataVolumeModel,
  ServiceBrokerModel,
  ServiceClassModel,
  ServicePlanModel,
  ClusterServiceBrokerModel,
  ClusterServiceClassModel,
  ClusterServicePlanModel,
  ServiceInstanceModel,
  ServiceBindingModel,
  CatalogServiceClaimModel,
  ClusterTemplateModel,
  TemplateModel,
  TemplateInstanceModel,
  TaskModel,
  ClusterTaskModel,
  TaskRunModel,
  PipelineModel,
  PipelineRunModel,
  ApprovalModel,
  PipelineResourceModel,
  RegistryModel,
  ImageSignerModel,
  ImageSignRequestModel,
  IntegrationConfigModel,
} from '../../models';

type ResourceMapKey = GroupVersionKind | string;
type ResourceMapValue = () => Promise<React.ComponentType<any>>;

export const hyperCloudDetailsPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(PodSecurityPolicyModel), () => import('./pod-security-policy' /* webpackChunkName: "podsecuritypolicy" */).then(m => m.PodSecurityPoliciesDetailsPage))
  .set(referenceForModel(ResourceQuotaClaimModel), () => import('./resource-quota-claim' /* webpackChunkName: "resourcequotaclaim" */).then(m => m.ResourceQuotaClaimsDetailsPage))
  .set(referenceForModel(RoleBindingClaimModel), () => import('./role-binding-claim' /* webpackChunkName: "rolebindingclaim" */).then(m => m.RoleBindingClaimsDetailsPage))
  .set(referenceForModel(NamespaceClaimModel), () => import('./namespace-claim' /* webpackChunkName: "namespaceclaim" */).then(m => m.NamespaceClaimsDetailsPage))
  .set(referenceForModel(HyperClusterResourceModel), () => import('./cluster' /* webpackChunkName: "cluster" */).then(m => m.ClustersDetailsPage))
  .set(referenceForModel(FederatedConfigMapModel), () => import('./federated-config-map' /* webpackChunkName: "configmap" */).then(m => m.FederatedConfigMapsDetailsPage))
  .set(referenceForModel(FederatedDeploymentModel), () => import('./federated-deployment' /* webpackChunkName: "deployment" */).then(m => m.FederatedDeploymentsDetailsPage))
  .set(referenceForModel(FederatedIngressModel), () => import('./federated-ingress' /* webpackChunkName: "ingress" */).then(m => m.FederatedIngressesDetailsPage))
  .set(referenceForModel(FederatedNamespaceModel), () => import('./federated-namespace' /* webpackChunkName: "namespace" */).then(m => m.FederatedNamespacesDetailsPage))
  .set(referenceForModel(FederatedJobModel), () => import('./federated-job' /* webpackChunkName: "job" */).then(m => m.FederatedJobsDetailsPage))
  .set(referenceForModel(FederatedReplicaSetModel), () => import('./federated-replica-set' /* webpackChunkName: "replica-set" */).then(m => m.FederatedReplicaSetsDetailsPage))
  .set(referenceForModel(FederatedSecretModel), () => import('./federated-secret' /* webpackChunkName: "secret" */).then(m => m.FederatedSecretsDetailsPage))
  .set(referenceForModel(FederatedServiceModel), () => import('./federated-service' /* webpackChunkName: "service" */).then(m => m.FederatedServicesDetailsPage))
  .set(referenceForModel(FederatedPodModel), () => import('./federated-pod' /* webpackChunkName: "pod" */).then(m => m.FederatedPodsDetailsPage))
  .set(referenceForModel(FederatedHPAModel), () => import('./federated-horizontalpodautoscaler' /* webpackChunkName: "horizontalpodautoscaler" */).then(m => m.FederatedHPAsDetailsPage))
  .set(referenceForModel(FederatedDaemonSetModel), () => import('./federated-daemonset' /* webpackChunkName: "daemonset" */).then(m => m.FederatedDaemonSetsDetailsPage))
  .set(referenceForModel(FederatedStatefulSetModel), () => import('./federated-statefulset' /* webpackChunkName: "statefulset" */).then(m => m.FederatedStatefulSetsDetailsPage))
  .set(referenceForModel(FederatedCronJobModel), () => import('./federated-cronjob' /* webpackChunkName: "cronjob" */).then(m => m.FederatedCronJobsDetailsPage))
  .set(referenceForModel(TaskModel), () => import('./task' /* webpackChunkName: "task" */).then(m => m.TasksDetailsPage))
  .set(referenceForModel(ClusterTaskModel), () => import('./cluster-task' /* webpackChunkName: "cluster-task" */).then(m => m.ClusterTasksDetailsPage))
  .set(referenceForModel(TaskRunModel), () => import('./task-run' /* webpackChunkName: "task-run" */).then(m => m.TaskRunsDetailsPage))
  .set(referenceForModel(PipelineModel), () => import('./pipeline' /* webpackChunkName: "pipeline" */).then(m => m.PipelinesDetailsPage))
  .set(referenceForModel(PipelineRunModel), () => import('./pipeline-run' /* webpackChunkName: "pipeline-run" */).then(m => m.PipelineRunsDetailsPage))
  .set(referenceForModel(ApprovalModel), () => import('./pipeline-approval' /* webpackChunkName: "pipeline-approval" */).then(m => m.PipelineApprovalsDetailsPage))
  .set(referenceForModel(PipelineResourceModel), () => import('./pipeline-resource' /* webpackChunkName: "pipeline-resource" */).then(m => m.PipelineResourcesDetailsPage))
  .set(referenceForModel(IntegrationConfigModel), () => import('./integration-config' /* webpackChunkName: "pipeline-resource" */).then(m => m.IntegrationConfigsDetailsPage))
  .set(referenceForModel(VirtualMachineModel), () => import('./virtual-machine' /* webpackChunkName: "virtual-machine" */).then(m => m.VirtualMachinesDetailsPage))
  .set(referenceForModel(VirtualMachineInstanceModel), () => import('./virtual-machine-instance' /* webpackChunkName: "virtual-machine-instance" */).then(m => m.VirtualMachineInstancesDetailsPage))
  .set(referenceForModel(VirtualServiceModel), () => import('./virtual-service' /* webpackChunkName: "virtual-service" */).then(m => m.VirtualServicesDetailsPage))
  .set(referenceForModel(DestinationRuleModel), () => import('./destination-rule' /* webpackChunkName: "destination-rule" */).then(m => m.DestinationRulesDetailsPage))
  .set(referenceForModel(EnvoyFilterModel), () => import('./envoy-filter' /* webpackChunkName: "envoy-filter" */).then(m => m.EnvoyFiltersDetailsPage))
  .set(referenceForModel(GatewayModel), () => import('./gateway' /* webpackChunkName: "gateway" */).then(m => m.GatewaysDetailsPage))
  .set(referenceForModel(SidecarModel), () => import('./sidecar' /* webpackChunkName: "sidecar" */).then(m => m.SidecarsDetailsPage))
  .set(referenceForModel(ServiceEntryModel), () => import('./service-entry' /* webpackChunkName: "service-entry" */).then(m => m.ServiceEntriesDetailsPage))
  .set(referenceForModel(RequestAuthenticationModel), () => import('./request-authentication' /* webpackChunkName: "request-authentication" */).then(m => m.RequestAuthenticationsDetailsPage))
  .set(referenceForModel(PeerAuthenticationModel), () => import('./peer-authentication' /* webpackChunkName: "peer-authentication" */).then(m => m.PeerAuthenticationsDetailsPage))
  .set(referenceForModel(AuthorizationPolicyModel), () => import('./authentication-policy' /* webpackChunkName: "authentication-policy" */).then(m => m.AuthorizationPoliciesDetailsPage))
  .set(referenceForModel(DataVolumeModel), () => import('./data-volume' /* webpackChunkName: "data-volume" */).then(m => m.DataVolumesDetailsPage))
  .set(referenceForModel(ServiceBrokerModel), () => import('./service-broker' /* webpackChunkName: "servicebroker" */).then(m => m.ServiceBrokersDetailsPage))
  .set(referenceForModel(ServiceClassModel), () => import('./service-class' /* webpackChunkName: "serviceclass" */).then(m => m.ServiceClassesDetailsPage))
  .set(referenceForModel(ServicePlanModel), () => import('./service-plan' /* webpackChunkName: "serviceplan" */).then(m => m.ServicePlansDetailsPage))
  .set(referenceForModel(ClusterServiceBrokerModel), () => import('./cluster-service-broker' /* webpackChunkName: "clusterservicebroker" */).then(m => m.ClusterServiceBrokersDetailsPage))
  .set(referenceForModel(ClusterServiceClassModel), () => import('./cluster-service-class' /* webpackChunkName: "clusterserviceclass" */).then(m => m.ClusterServiceClassesDetailsPage))
  .set(referenceForModel(ClusterServicePlanModel), () => import('./cluster-service-plan' /* webpackChunkName: "clusterserviceplan" */).then(m => m.ClusterServicePlansDetailsPage))
  .set(referenceForModel(ServiceInstanceModel), () => import('./service-instance' /* webpackChunkName: "serviceinstance" */).then(m => m.ServiceInstancesDetailsPage))
  .set(referenceForModel(ServiceBindingModel), () => import('./service-binding' /* webpackChunkName: "servicebinding" */).then(m => m.ServiceBindingsDetailsPage))
  .set(referenceForModel(CatalogServiceClaimModel), () => import('./catalog-service-claim' /* webpackChunkName: "catalogserviceclaim" */).then(m => m.CatalogServiceClaimsDetailsPage))
  .set(referenceForModel(ClusterTemplateModel), () => import('./cluster-template' /* webpackChunkName: "clustertemplate" */).then(m => m.ClusterTemplatesDetailsPage))
  .set(referenceForModel(TemplateModel), () => import('./template' /* webpackChunkName: "template" */).then(m => m.TemplatesDetailsPage))
  .set(referenceForModel(TemplateInstanceModel), () => import('./template-instance' /* webpackChunkName: "templateinstance" */).then(m => m.TemplateInstancesDetailsPage))
  .set(referenceForModel(RegistryModel), () => import('./registry' /* webpackChunkName: "registry" */).then(m => m.RegistriesDetailsPage))
  .set(referenceForModel(ImageSignerModel), () => import('./image-signer' /* webpackChunkName: "image-signer" */).then(m => m.ImageSignersDetailsPage))
  .set(referenceForModel(ImageSignRequestModel), () => import('./image-sign-request' /* webpackChunkName: "image-sign-request" */).then(m => m.ImageSignRequestsDetailsPage));

export const hyperCloudListPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(PodSecurityPolicyModel), () => import('./pod-security-policy' /* webpackChunkName: "pod-security-policy" */).then(m => m.PodSecurityPoliciesPage))
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
  .set(referenceForModel(FederatedHPAModel), () => import('./federated-horizontalpodautoscaler' /* webpackChunkName: "horizontalpodautoscaler" */).then(m => m.FederatedHPAsPage))
  .set(referenceForModel(FederatedDaemonSetModel), () => import('./federated-daemonset' /* webpackChunkName: "daemonset" */).then(m => m.FederatedDaemonSetsPage))
  .set(referenceForModel(FederatedStatefulSetModel), () => import('./federated-statefulset' /* webpackChunkName: "statefulset" */).then(m => m.FederatedStatefulSetsPage))
  .set(referenceForModel(FederatedCronJobModel), () => import('./federated-cronjob' /* webpackChunkName: "cronjob" */).then(m => m.FederatedCronJobsPage))
  .set(referenceForModel(TaskModel), () => import('./task' /* webpackChunkName: "task" */).then(m => m.TasksPage))
  .set(referenceForModel(ClusterTaskModel), () => import('./cluster-task' /* webpackChunkName: "cluster-task" */).then(m => m.ClusterTasksPage))
  .set(referenceForModel(TaskRunModel), () => import('./task-run' /* webpackChunkName: "task-run" */).then(m => m.TaskRunsPage))
  .set(referenceForModel(PipelineModel), () => import('./pipeline' /* webpackChunkName: "pipeline" */).then(m => m.PipelinesPage))
  .set(referenceForModel(PipelineRunModel), () => import('./pipeline-run' /* webpackChunkName: "pipeline-run" */).then(m => m.PipelineRunsPage))
  .set(referenceForModel(ApprovalModel), () => import('./pipeline-approval' /* webpackChunkName: "pipeline-approval" */).then(m => m.PipelineApprovalsPage))
  .set(referenceForModel(PipelineResourceModel), () => import('./pipeline-resource' /* webpackChunkName: "pipeline-resource" */).then(m => m.PipelineResourcesPage))
  .set(referenceForModel(IntegrationConfigModel), () => import('./integration-config' /* webpackChunkName: "pipeline-resource" */).then(m => m.IntegrationConfigsPage))
  .set(referenceForModel(VirtualMachineModel), () => import('./virtual-machine' /* webpackChunkName: "virtual-machine" */).then(m => m.VirtualMachinesPage))
  .set(referenceForModel(VirtualMachineInstanceModel), () => import('./virtual-machine-instance' /* webpackChunkName: "virtual-machine-instance" */).then(m => m.VirtualMachineInstancesPage))
  .set(referenceForModel(VirtualServiceModel), () => import('./virtual-service' /* webpackChunkName: "virtual-service" */).then(m => m.VirtualServicesPage))
  .set(referenceForModel(DestinationRuleModel), () => import('./destination-rule' /* webpackChunkName: "destination-rule" */).then(m => m.DestinationRulesPage))
  .set(referenceForModel(EnvoyFilterModel), () => import('./envoy-filter' /* webpackChunkName: "envoy-filter" */).then(m => m.EnvoyFiltersPage))
  .set(referenceForModel(GatewayModel), () => import('./gateway' /* webpackChunkName: "gateway" */).then(m => m.GatewaysPage))
  .set(referenceForModel(SidecarModel), () => import('./sidecar' /* webpackChunkName: "sidecar" */).then(m => m.SidecarsPage))
  .set(referenceForModel(ServiceEntryModel), () => import('./service-entry' /* webpackChunkName: "service-entry" */).then(m => m.ServiceEntriesPage))
  .set(referenceForModel(RequestAuthenticationModel), () => import('./request-authentication' /* webpackChunkName: "request-authentication" */).then(m => m.RequestAuthenticationsPage))
  .set(referenceForModel(PeerAuthenticationModel), () => import('./peer-authentication' /* webpackChunkName: "peer-authentication" */).then(m => m.PeerAuthenticationsPage))
  .set(referenceForModel(AuthorizationPolicyModel), () => import('./authentication-policy' /* webpackChunkName: "authentication-policy" */).then(m => m.AuthorizationPoliciesPage))
  .set(referenceForModel(DataVolumeModel), () => import('./data-volume' /* webpackChunkName: "data-volume" */).then(m => m.DataVolumesPage))
  .set(referenceForModel(ResourceQuotaClaimModel), () => import('./resource-quota-claim' /* webpackChunkName: "resourcequotaclaim" */).then(m => m.ResourceQuotaClaimsPage))
  .set(referenceForModel(RoleBindingClaimModel), () => import('./role-binding-claim' /* webpackChunkName: "rolebindingclaim" */).then(m => m.RoleBindingClaimsPage))
  .set(referenceForModel(NamespaceClaimModel), () => import('./namespace-claim' /* webpackChunkName: "namespaceclaim" */).then(m => m.NamespaceClaimsPage))
  .set(referenceForModel(ServiceBrokerModel), () => import('./service-broker' /* webpackChunkName: "servicebroker" */).then(m => m.ServiceBrokersPage))
  .set(referenceForModel(ServiceClassModel), () => import('./service-class' /* webpackChunkName: "serviceclass" */).then(m => m.ServiceClassesPage))
  .set(referenceForModel(ServicePlanModel), () => import('./service-plan' /* webpackChunkName: "serviceplan" */).then(m => m.ServicePlansPage))
  .set(referenceForModel(ClusterServiceBrokerModel), () => import('./cluster-service-broker' /* webpackChunkName: "clusterservicebroker" */).then(m => m.ClusterServiceBrokersPage))
  .set(referenceForModel(ClusterServiceClassModel), () => import('./cluster-service-class' /* webpackChunkName: "clusterserviceclass" */).then(m => m.ClusterServiceClassesPage))
  .set(referenceForModel(ClusterServicePlanModel), () => import('./cluster-service-plan' /* webpackChunkName: "clusterserviceplan" */).then(m => m.ClusterServicePlansPage))
  .set(referenceForModel(ServiceInstanceModel), () => import('./service-instance' /* webpackChunkName: "serviceinstance" */).then(m => m.ServiceInstancesPage))
  .set(referenceForModel(ServiceBindingModel), () => import('./service-binding' /* webpackChunkName: "servicebinding" */).then(m => m.ServiceBindingsPage))
  .set(referenceForModel(CatalogServiceClaimModel), () => import('./catalog-service-claim' /* webpackChunkName: "catalogserviceclaim" */).then(m => m.CatalogServiceClaimsPage))
  .set(referenceForModel(ClusterTemplateModel), () => import('./cluster-template' /* webpackChunkName: "clustertemplate" */).then(m => m.ClusterTemplatesPage))
  .set(referenceForModel(TemplateModel), () => import('./template' /* webpackChunkName: "template" */).then(m => m.TemplatesPage))
  .set(referenceForModel(TemplateInstanceModel), () => import('./template-instance' /* webpackChunkName: "templateinstance" */).then(m => m.TemplateInstancesPage))
  .set(referenceForModel(RegistryModel), () => import('./registry' /* webpackChunkName: "registry" */).then(m => m.RegistriesPage))
  .set(referenceForModel(ImageSignerModel), () => import('./image-signer' /* webpackChunkName: "image-signer" */).then(m => m.ImageSignersPage))
  .set(referenceForModel(ImageSignRequestModel), () => import('./image-sign-request' /* webpackChunkName: "image-sign-request" */).then(m => m.ImageSignRequestsPage));
