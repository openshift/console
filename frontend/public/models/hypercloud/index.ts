import { K8sKind } from '../../module/k8s';

export const HyperClusterResourceModel: K8sKind = {
  label: 'Cluster',
  labelPlural: 'Clusters',
  apiVersion: 'v1',
  apiGroup: 'hyper.multi.tmax.io',
  plural: 'hyperclusterresources',
  abbr: 'C',
  kind: 'HyperClusterResource',
  id: 'hyperclusterresource',
  namespaced: false,
};

export const ClusterManagerModel: K8sKind = {
  label: 'Cluster',
  labelPlural: 'Clusters',
  apiVersion: 'v1alpha1',
  apiGroup: 'cluster.tmax.io',
  plural: 'clustermanagers',
  abbr: 'CM',
  kind: 'ClusterManager',
  id: 'clustermanager',
  namespaced: true,
};

export const ClusterClaimModel: K8sKind = {
  label: 'ClusterClaim',
  labelPlural: 'Clusters Claims',
  apiVersion: 'v1alpha1',
  apiGroup: 'claims.tmax.io',
  plural: 'clusterclaims',
  abbr: 'CC',
  kind: 'ClusterClaim',
  id: 'clusterclaim',
  namespaced: true,
}

export const SignerPolicyModel: K8sKind = {
  kind: 'SignerPolicy',
  label: 'Signer Policy',
  labelPlural: 'Signer Policies',
  apiGroup: 'tmax.io',
  apiVersion: 'v1',
  abbr: 'SP',
  namespaced: true,
  crd: false,
  id: 'signerpolicy',
  plural: 'signerpolicies',
};

export const PodSecurityPolicyModel: K8sKind = {
  kind: 'PodSecurityPolicy',
  namespaced: false,
  label: 'Pod Security Policy',
  plural: 'podsecuritypolicies',
  apiVersion: 'v1beta1',
  abbr: 'PSP',
  apiGroup: 'policy',
  labelPlural: 'Pod Security Policies',
  id: 'podsecuritypolicie',
  crd: false,
};

export const FederatedConfigMapModel: K8sKind = {
  label: 'Federated Config Map',
  labelPlural: 'Federated Config Maps',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedconfigmaps',
  abbr: 'FCM',
  kind: 'FederatedConfigMap',
  id: 'federatedconfigmap',
  namespaced: true,
};

export const FederatedDeploymentModel: K8sKind = {
  label: 'Federated Deployment',
  labelPlural: 'Federated Deployments',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federateddeployments',
  abbr: 'FDEPLOY',
  kind: 'FederatedDeployment',
  id: 'federateddeployment',
  namespaced: true,
};

export const FederatedIngressModel: K8sKind = {
  label: 'Federated Ingress',
  labelPlural: 'Federated Ingresses',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedingresses',
  abbr: 'FING',
  kind: 'FederatedIngress',
  id: 'federatedingress',
  namespaced: true,
};

export const FederatedJobModel: K8sKind = {
  label: 'Federated Job',
  labelPlural: 'Federated Jobs',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedjobs',
  abbr: 'FJ',
  kind: 'FederatedJob',
  id: 'federatedjob',
  namespaced: true,
};

export const FederatedNamespaceModel: K8sKind = {
  label: 'Federated Namespace',
  labelPlural: 'Federated Namespaces',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatednamespaces',
  abbr: 'FNS',
  kind: 'FederatedNamespace',
  id: 'federatednamespace',
  namespaced: true,
};

export const FederatedReplicaSetModel: K8sKind = {
  label: 'Federated Replica Set',
  labelPlural: 'Federated Replica Sets',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedreplicasets',
  abbr: 'FRS',
  kind: 'FederatedReplicaSet',
  id: 'federatedreplicaset',
  namespaced: true,
};

export const FederatedSecretModel: K8sKind = {
  label: 'Federated Secret',
  labelPlural: 'Federated Secrets',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedsecrets',
  abbr: 'FS',
  kind: 'FederatedSecret',
  id: 'federatedsecret',
  namespaced: true,
};

export const FederatedServiceModel: K8sKind = {
  label: 'Federated Service',
  labelPlural: 'Federated Services',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedservices',
  abbr: 'FSVC',
  kind: 'FederatedService',
  id: 'federatedservice',
  namespaced: true,
};

export const FederatedPodModel: K8sKind = {
  label: 'Federated Pod',
  labelPlural: 'Federated Pods',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedpods',
  abbr: 'FPO',
  kind: 'FederatedPod',
  id: 'federatedpod',
  namespaced: true,
};

export const FederatedHPAModel: K8sKind = {
  label: 'Federated Horizontal Pod Autoscaler',
  labelPlural: 'Federated Horizontal Pod Autoscalers',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedhorizontalpodautoscalers',
  abbr: 'FHPA',
  kind: 'FederatedHorizontalPodAutoscaler',
  id: 'federatedhorizontalpodautoscaler',
  namespaced: true,
};

export const FederatedDaemonSetModel: K8sKind = {
  label: 'Federated Daemon Set',
  labelPlural: 'Federated Daemon Sets',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federateddaemonsets',
  abbr: 'FDS',
  kind: 'FederatedDaemonSet',
  id: 'federateddaemonset',
  namespaced: true,
};

export const FederatedStatefulSetModel: K8sKind = {
  label: 'Federated Stateful Set',
  labelPlural: 'Federated Stateful Sets',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedstatefulsets',
  abbr: 'FSTS',
  kind: 'FederatedStatefulSet',
  id: 'federatedstatefulset',
  namespaced: true,
};

export const FederatedCronJobModel: K8sKind = {
  label: 'Federated Cron Job',
  labelPlural: 'Federated Cron Jobs',
  apiVersion: 'v1beta1',
  apiGroup: 'types.kubefed.io',
  plural: 'federatedcronjobs',
  abbr: 'FCJ',
  kind: 'FederatedCronJob',
  id: 'federatedcronjob',
  namespaced: true,
};

export const RegistryModel: K8sKind = {
  kind: 'Registry',
  namespaced: true,
  label: 'Registry',
  plural: 'registries',
  apiVersion: 'v1',
  abbr: 'RG',
  apiGroup: 'tmax.io',
  labelPlural: 'Registries',
  id: 'registry',
  crd: false,
};

export const RepositoryModel: K8sKind = {
  kind: 'Repository',
  namespaced: true,
  label: 'Repository',
  plural: 'repositories',
  apiVersion: 'v1',
  abbr: 'RP',
  apiGroup: 'tmax.io',
  labelPlural: 'Repositories',
  id: 'repository',
  crd: false,
};

export const NotaryModel: K8sKind = {
  kind: 'Notary',
  namespaced: true,
  label: 'Notary',
  plural: 'notaries',
  apiVersion: 'v1',
  abbr: 'N',
  apiGroup: 'tmax.io',
  labelPlural: 'Notaries',
  id: 'notary',
  crd: false,
};

export const ImageModel: K8sKind = {
  label: 'Image',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'images',
  abbr: 'I',
  namespaced: true,
  kind: 'Image',
  id: 'image',
  labelPlural: 'Images',
  crd: false,
};

export const ImageSignerModel: K8sKind = {
  label: 'Image Signer',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'imagesigners',
  abbr: 'IS',
  namespaced: false,
  kind: 'ImageSigner',
  id: 'imagesigner',
  labelPlural: 'Image Signers',
  crd: false,
};

export const ImageSignRequestModel: K8sKind = {
  label: 'Image Sign Request',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'imagesignrequests',
  abbr: 'ISR',
  namespaced: true,
  kind: 'ImageSignRequest',
  id: 'imagesignrequest',
  labelPlural: 'Image Sign Requests',
  crd: false,
};
export const ImageScanRequestModel: K8sKind = {
  label: 'Image Scan Request',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'imagescanrequests',
  abbr: 'ISR',
  namespaced: true,
  kind: 'ImageScanRequest',
  id: 'imagescanrequest',
  labelPlural: 'Image Scan Requests',
  crd: false,
};

export const TaskModel: K8sKind = {
  kind: 'Task',
  namespaced: true,
  label: 'Task',
  plural: 'tasks',
  apiVersion: 'v1beta1',
  abbr: 'TK',
  apiGroup: 'tekton.dev',
  labelPlural: 'Tasks',
  id: 'task',
  crd: false,
};

export const ClusterTaskModel: K8sKind = {
  kind: 'ClusterTask',
  namespaced: false,
  label: 'ClusterTask',
  plural: 'clustertasks',
  apiVersion: 'v1beta1',
  abbr: 'CTK',
  apiGroup: 'tekton.dev',
  labelPlural: 'Cluster Tasks',
  id: 'clustertask',
  crd: false,
};

export const TaskRunModel: K8sKind = {
  kind: 'TaskRun',
  namespaced: true,
  label: 'Task Run',
  plural: 'taskruns',
  apiVersion: 'v1beta1',
  abbr: 'TR',
  apiGroup: 'tekton.dev',
  labelPlural: 'Task Runs',
  id: 'taskrun',
  crd: false,
};

export const PipelineModel: K8sKind = {
  kind: 'Pipeline',
  namespaced: true,
  label: 'Pipeline',
  plural: 'pipelines',
  apiVersion: 'v1beta1',
  abbr: 'P',
  apiGroup: 'tekton.dev',
  labelPlural: 'Pipelines',
  id: 'pipeline',
  crd: false,
};

export const PipelineRunModel: K8sKind = {
  kind: 'PipelineRun',
  namespaced: true,
  label: 'Pipeline Run',
  plural: 'pipelineruns',
  apiVersion: 'v1beta1',
  abbr: 'PR',
  apiGroup: 'tekton.dev',
  labelPlural: 'Pipeline Runs',
  id: 'pipelinerun',
  crd: false,
};

export const ApprovalModel: K8sKind = {
  kind: 'Approval',
  namespaced: true,
  label: 'Approval',
  plural: 'approvals',
  apiVersion: 'v1',
  abbr: 'PA',
  apiGroup: 'cicd.tmax.io',
  labelPlural: 'Pipeline Approvals',
  id: 'approval',
  crd: false,
};

export const PipelineResourceModel: K8sKind = {
  kind: 'PipelineResource',
  namespaced: true,
  label: 'Pipeline Resource',
  plural: 'pipelineresources',
  apiVersion: 'v1alpha1',
  abbr: 'PRS',
  apiGroup: 'tekton.dev',
  labelPlural: 'Pipeline Resources',
  id: 'pipelineresource',
  crd: false,
};

export const IntegrationJobModel: K8sKind = {
  kind: 'IntegrationJob',
  namespaced: true,
  label: 'Integration Job',
  plural: 'integrationjobs',
  apiVersion: 'v1',
  abbr: 'IJ',
  apiGroup: 'cicd.tmax.io',
  labelPlural: 'Integration Jobs',
  id: 'integrationjob',
  crd: false,
};

export const IntegrationConfigModel: K8sKind = {
  kind: 'IntegrationConfig',
  namespaced: true,
  label: 'Integration Config',
  plural: 'integrationconfigs',
  apiVersion: 'v1',
  abbr: 'IC',
  apiGroup: 'cicd.tmax.io',
  labelPlural: 'Integration Configs',
  id: 'integrationconfig',
  crd: false,
};

export const VirtualMachineModel: K8sKind = {
  label: 'VirtualMachine',
  labelPlural: 'VirtualMachines',
  apiVersion: 'v1alpha3',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachines',
  abbr: 'vm',
  kind: 'VirtualMachine',
  id: 'virtualmachine',
  namespaced: true,
};

export const VirtualMachineInstanceModel: K8sKind = {
  label: 'VirtualMachineInstance',
  labelPlural: 'VirtualMachineInstances',
  apiVersion: 'v1alpha3',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstances',
  abbr: 'vmi',
  kind: 'VirtualMachineInstance',
  id: 'virtualmachineinstance',
  namespaced: true,
};

export const VirtualServiceModel: K8sKind = {
  label: 'Virtual Service',
  labelPlural: 'Virtual Services',
  apiVersion: 'v1alpha3',
  apiGroup: 'networking.istio.io',
  plural: 'virtualservices',
  abbr: 'vs',
  kind: 'VirtualService',
  id: 'virtualservice',
  namespaced: true,
};

export const DestinationRuleModel: K8sKind = {
  label: 'Destination Rule',
  labelPlural: 'Destination Rules',
  apiVersion: 'v1alpha3',
  apiGroup: 'networking.istio.io',
  plural: 'destinationrules',
  abbr: 'dr',
  kind: 'DestinationRule',
  id: 'destinationrule',
  namespaced: true,
};

export const EnvoyFilterModel: K8sKind = {
  label: 'Envoy Filter',
  labelPlural: 'Envoy Filters',
  apiVersion: 'v1alpha3',
  apiGroup: 'networking.istio.io',
  plural: 'envoyfilters',
  abbr: 'ef',
  kind: 'EnvoyFilter',
  id: 'envoyfilter',
  namespaced: true,
};

export const GatewayModel: K8sKind = {
  label: 'Gateway',
  labelPlural: 'Gateways',
  apiVersion: 'v1alpha3',
  apiGroup: 'networking.istio.io',
  plural: 'gateways',
  abbr: 'g',
  kind: 'Gateway',
  id: 'gateway',
  namespaced: true,
};

export const SidecarModel: K8sKind = {
  label: 'Sidecar',
  labelPlural: 'Sidecars',
  apiVersion: 'v1alpha3',
  apiGroup: 'networking.istio.io',
  plural: 'sidecars',
  abbr: 'sc',
  kind: 'Sidecar',
  id: 'sidecar',
  namespaced: true,
};

export const ServiceEntryModel: K8sKind = {
  label: 'Service Entry',
  labelPlural: 'Service Entries',
  apiVersion: 'v1alpha3',
  apiGroup: 'networking.istio.io',
  plural: 'serviceentries',
  abbr: 'se',
  kind: 'ServiceEntry',
  id: 'serviceentry',
  namespaced: true,
};

export const RequestAuthenticationModel: K8sKind = {
  label: 'Request Authentication',
  labelPlural: 'Request Authentications',
  apiVersion: 'v1beta1',
  apiGroup: 'security.istio.io',
  plural: 'requestauthentications',
  abbr: 'ra',
  kind: 'RequestAuthentication',
  id: 'requestauthentication',
  namespaced: true,
};

export const PeerAuthenticationModel: K8sKind = {
  label: 'Peer Authentication',
  labelPlural: 'Peer Authentications',
  apiVersion: 'v1beta1',
  apiGroup: 'security.istio.io',
  plural: 'peerauthentications',
  abbr: 'pa',
  kind: 'PeerAuthentication',
  id: 'peerauthentication',
  namespaced: true,
};

export const AuthorizationPolicyModel: K8sKind = {
  label: 'Authorization Policy',
  labelPlural: 'Authorization Policies',
  apiVersion: 'v1beta1',
  apiGroup: 'security.istio.io',
  plural: 'authorizationpolicies',
  abbr: 'ap',
  namespaced: true,
  kind: 'AuthorizationPolicy',
  id: 'authorizationpolicy',
};

export const DataVolumeModel: K8sKind = {
  label: 'Data Volume',
  labelPlural: 'Data Volumes',
  apiVersion: 'v1alpha1',
  apiGroup: 'cdi.kubevirt.io',
  plural: 'datavolumes',
  abbr: 'dv',
  kind: 'DataVolume',
  id: 'datavolume',
  namespaced: true,
};
export const NamespaceClaimModel: K8sKind = {
  label: 'NamespaceClaim',
  labelPlural: 'NamespaceClaims',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'namespaceclaims',
  abbr: 'NSC',
  kind: 'NamespaceClaim',
  id: 'namespaceclaim',
  namespaced: true,
};

export const ResourceQuotaClaimModel: K8sKind = {
  label: 'ResourceQuotaClaim',
  labelPlural: 'ResourceQuotaClaims',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'resourcequotaclaims',
  abbr: 'RQC',
  kind: 'ResourceQuotaClaim',
  id: 'resourcequotaclaim',
  namespaced: true,
};

export const RoleBindingClaimModel: K8sKind = {
  label: 'RoleBindingClaim',
  labelPlural: 'RoleBindingClaims',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'rolebindingclaims',
  abbr: 'RBC',
  kind: 'RoleBindingClaim',
  id: 'rolebindingclaim',
  namespaced: true,
};

export const ServiceBrokerModel: K8sKind = {
  label: 'Service Broker',
  labelPlural: 'Service Brokers',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'servicebrokers',
  abbr: 'SB',
  kind: 'ServiceBroker',
  id: 'servicebroker',
  namespaced: true,
};

export const ServiceClassModel: K8sKind = {
  label: 'Service Class',
  labelPlural: 'Service Classes',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'serviceclasses',
  abbr: 'SC',
  kind: 'ServiceClass',
  id: 'serviceclass',
  namespaced: true,
};

export const ServicePlanModel: K8sKind = {
  label: 'Service Plan',
  labelPlural: 'Service Plans',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'serviceplans',
  abbr: 'SP',
  kind: 'ServicePlan',
  id: 'serviceplan',
  namespaced: true,
};

export const ClusterServiceBrokerModel: K8sKind = {
  label: 'Cluster Service Broker',
  labelPlural: 'Cluster Service Brokers',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterservicebrokers',
  abbr: 'CSB',
  kind: 'ClusterServiceBroker',
  id: 'clusterservicebroker',
  namespaced: false,
};

export const ClusterServiceClassModel: K8sKind = {
  label: 'Cluster Service Class',
  labelPlural: 'Cluster Service Classes',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterserviceclasses',
  abbr: 'CSC',
  kind: 'ClusterServiceClass',
  id: 'clusterserviceclass',
  namespaced: false,
};

export const ClusterServicePlanModel: K8sKind = {
  label: 'Cluster Service Plan',
  labelPlural: 'Cluster Service Plans',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterserviceplans',
  abbr: 'CSP',
  kind: 'ClusterServicePlan',
  id: 'clusterserviceplan',
  namespaced: false,
};

export const ServiceInstanceModel: K8sKind = {
  label: 'Service Instance',
  labelPlural: 'Service Instances',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'serviceinstances',
  abbr: 'SI',
  kind: 'ServiceInstance',
  id: 'serviceinstance',
  namespaced: true,
};

export const ServiceBindingModel: K8sKind = {
  label: 'Service Binding',
  labelPlural: 'Service Bindings',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'servicebindings',
  abbr: 'SB',
  kind: 'ServiceBinding',
  id: 'servicebinding',
  namespaced: true,
};

export const CatalogServiceClaimModel: K8sKind = {
  label: 'CatalogServiceClaim',
  labelPlural: 'Catalog Service Claim',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'catalogserviceclaims',
  abbr: 'CSC',
  kind: 'CatalogServiceClaim',
  id: 'catalogserviceclaim',
  namespaced: true,
};

export const TemplateModel: K8sKind = {
  label: 'Template',
  labelPlural: 'Templates',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'templates',
  abbr: 'T',
  kind: 'Template',
  id: 'template',
  namespaced: true,
};

export const TemplateInstanceModel: K8sKind = {
  label: 'Template Instance',
  labelPlural: 'Template Instances',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'templateinstances',
  abbr: 'TI',
  kind: 'TemplateInstance',
  id: 'templateinstance',
  namespaced: true,
};

export const ClusterTemplateModel: K8sKind = {
  label: 'Cluster Template',
  labelPlural: 'Cluster Templates',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'clustertemplates',
  abbr: 'CT',
  kind: 'ClusterTemplate',
  id: 'clustertemplate',
  namespaced: false,
};

export const EventListenerModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Event Listener',
  plural: 'eventlisteners',
  abbr: 'EL',
  namespaced: true,
  kind: 'EventListener',
  id: 'eventlistener',
  labelPlural: 'Event Listeners',
  crd: false,
};

export const TriggerTemplateModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Trigger Template',
  plural: 'triggertemplates',
  abbr: 'TT',
  namespaced: true,
  kind: 'TriggerTemplate',
  id: 'triggertemplate',
  labelPlural: 'Trigger Templates',
  crd: false,
};