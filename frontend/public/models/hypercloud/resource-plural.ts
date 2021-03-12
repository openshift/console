import { TFunction } from 'i18next';

export const ResourceLabel = (kindObj, t?: TFunction) => {
  if (!t || !ResourceStringKeyMap[kindObj.kind]?.labelPlural) {
    return kindObj.label;
  }
  // TODO: string 나오면 label 값으로 적용
  return t(ResourceStringKeyMap[kindObj.kind].labelPlural);
};

export const ResourceLabelPlural = (kindObj, t?: TFunction) => {
  if (!t || !ResourceStringKeyMap[kindObj.kind]?.labelPlural) {
    return kindObj.labelPlural;
  }

  return t(ResourceStringKeyMap[kindObj.kind].labelPlural);
};

const ResourceStringKeyMap = {
  ClusterClaim: {},
  ClusterManager: {
    labelPlural: 'COMMON:MSG_LNB_MENU_84',
  },
  FederatedPod: {},
  FederatedDeployment: {},
  FederatedReplicaSet: {},
  FederatedHorizontalPodAutoscaler: {},
  FederatedDaemonSet: {},
  FederatedStatefulSet: {},
  FederatedConfigMap: {},
  FederatedSecret: {},
  FederatedJob: {},
  FederatedCronJob: {},
  FederatedIngress: {},
  FederatedService: {},
  FederatedNamespace: {},
  //
  ServiceBroker: {
    labelPlural: 'COMMON:MSG_LNB_MENU_11',
  },
  ServiceClass: {
    labelPlural: 'COMMON:MSG_LNB_MENU_12',
  },
  ClusterServiceBroker: {
    labelPlural: 'COMMON:MSG_LNB_MENU_14',
  },
  ClusterServiceClass: {
    labelPlural: 'COMMON:MSG_LNB_MENU_15',
  },
  ServiceInstance: {
    labelPlural: 'COMMON:MSG_LNB_MENU_17',
  },
  ServiceBinding: {
    labelPlural: 'COMMON:MSG_LNB_MENU_18',
  },
  CatalogServiceClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_19',
  },
  Template: {
    labelPlural: 'COMMON:MSG_LNB_MENU_20',
  },
  ClusterTemplate: {
    labelPlural: 'COMMON:MSG_LNB_MENU_104',
  },
  TemplateInstance: {
    labelPlural: 'COMMON:MSG_LNB_MENU_21',
  },
  Pod: {
    labelPlural: 'COMMON:MSG_LNB_MENU_23',
  },
  Deployment: {
    labelPlural: 'COMMON:MSG_LNB_MENU_24',
  },
  ReplicaSet: {
    labelPlural: 'COMMON:MSG_LNB_MENU_31',
  },
  HorizontalPodAutoscaler: {
    labelPlural: 'COMMON:MSG_LNB_MENU_32',
  },
  DaemonSet: {
    labelPlural: 'COMMON:MSG_LNB_MENU_30',
  },
  StatefulSet: {
    labelPlural: 'COMMON:MSG_LNB_MENU_25',
  },
  ConfigMap: {
    labelPlural: 'COMMON:MSG_LNB_MENU_27',
  },
  Secret: {
    labelPlural: 'COMMON:MSG_LNB_MENU_26',
  },
  Job: {
    labelPlural: 'COMMON:MSG_LNB_MENU_29',
  },
  CronJob: {
    labelPlural: 'COMMON:MSG_LNB_MENU_28',
  },
  VirtualService: {
    labelPlural: 'COMMON:MSG_LNB_MENU_36',
  },
  DestinationRule: {
    labelPlural: 'COMMON:MSG_LNB_MENU_37',
  },
  EnvoyFilter: {
    labelPlural: 'COMMON:MSG_LNB_MENU_38',
  },
  Gateway: {
    labelPlural: 'COMMON:MSG_LNB_MENU_39',
  },
  Sidecar: {
    labelPlural: 'COMMON:MSG_LNB_MENU_40',
  },
  ServiceEntry: {
    labelPlural: 'COMMON:MSG_LNB_MENU_41',
  },
  RequestAuthentication: {
    labelPlural: 'COMMON:MSG_LNB_MENU_42',
  },
  PeerAuthentication: {
    labelPlural: 'COMMON:MSG_LNB_MENU_43',
  },
  AuthorizationPolicy: {
    labelPlural: 'COMMON:MSG_LNB_MENU_44',
  },
  Service: {
    labelPlural: 'COMMON:MSG_LNB_MENU_47',
  },
  Ingress: {
    labelPlural: 'COMMON:MSG_LNB_MENU_48',
  },
  NetworkPolicy: {
    labelPlural: 'COMMON:MSG_LNB_MENU_49',
  },
  StorageClass: {
    labelPlural: 'COMMON:MSG_LNB_MENU_53',
  },
  PersistentVolume: {
    labelPlural: 'COMMON:MSG_LNB_MENU_51',
  },
  PersistentVolumeClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_52',
  },
  Task: {
    labelPlural: 'COMMON:MSG_LNB_MENU_57',
  },
  ClusterTask: {
    labelPlural: 'COMMON:MSG_LNB_MENU_94',
  },
  TaskRun: {
    labelPlural: 'COMMON:MSG_LNB_MENU_58',
  },
  Pipeline: {
    labelPlural: 'COMMON:MSG_LNB_MENU_59',
  },
  PipelineRun: {
    labelPlural: 'COMMON:MSG_LNB_MENU_60',
  },
  Approval: {
    labelPlural: 'COMMON:MSG_LNB_MENU_61',
  },
  PipelineResource: {
    labelPlural: 'COMMON:MSG_LNB_MENU_62',
  },
  IntegrationJob: {
    //labelPlural: "COMMON:MSG_LNB_MENU_",
  },
  IntegrationConfig: {
    //labelPlural: "COMMON:MSG_LNB_MENU_",
  },
  Registry: {
    labelPlural: 'COMMON:MSG_LNB_MENU_71',
  },
  ExternalRegistry: {
    labelPlural: 'COMMON:MSG_LNB_MENU_97',
  },
  ImageSigner: {
    labelPlural: 'COMMON:MSG_LNB_MENU_91',
  },
  ImageSignRequest: {
    labelPlural: 'COMMON:MSG_LNB_MENU_92',
  },
  SignerPolicy: {
    labelPlural: 'COMMON:MSG_LNB_MENU_96',
  },
  Namespace: {
    labelPlural: 'COMMON:MSG_LNB_MENU_3',
  },
  NamespaceClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_103',
  },
  LimitRange: {
    labelPlural: 'COMMON:MSG_LNB_MENU_81',
  },
  ResourceQuota: {
    labelPlural: 'COMMON:MSG_LNB_MENU_80',
  },
  ResourceQuotaClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_102',
  },
  CustomResourceDefinition: {
    labelPlural: 'COMMON:MSG_LNB_MENU_82',
  },
  Node: {
    labelPlural: 'COMMON:MSG_LNB_MENU_100',
  },
  Role: {
    labelPlural: 'COMMON:MSG_LNB_MENU_75',
  },
  RoleBinding: {
    labelPlural: 'COMMON:MSG_LNB_MENU_76',
  },
  RoleBindingClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_101',
  },
  ClusterRoleBinding: {
    labelPlural: 'Cluster Role Binding',
  },
  ServiceAccount: {
    labelPlural: 'COMMON:MSG_LNB_MENU_74',
  },
  PodSecurityPolicy: {
    labelPlural: 'COMMON:MSG_LNB_MENU_78',
  },
};
