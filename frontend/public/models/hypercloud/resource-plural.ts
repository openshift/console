import { TFunction } from 'i18next';

export const ResourceLabel = (kindObj, t?: TFunction) => {
  if (!t || !ResourceStringKeyMap[kindObj.kind]?.label) {
    return kindObj.label;
  }
  return t(ResourceStringKeyMap[kindObj.kind].label);
};

export const ResourceLabelPlural = (kindObj, t?: TFunction) => {
  if (!t || !ResourceStringKeyMap[kindObj.kind]?.labelPlural) {
    return kindObj.labelPlural;
  }

  return t(ResourceStringKeyMap[kindObj.kind].labelPlural);
};

export const ResourceStringKeyMap = {
  ClusterClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_105',
    label: 'COMMON:MSG_LNB_MENU_182',
  },
  ClusterManager: {
    labelPlural: 'COMMON:MSG_LNB_MENU_84',
    label: 'COMMON:MSG_LNB_MENU_165',
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
    label: 'COMMON:MSG_LNB_MENU_107',
  },
  ServiceClass: {
    labelPlural: 'COMMON:MSG_LNB_MENU_12',
    label: 'COMMON:MSG_LNB_MENU_108',
  },
  ClusterServiceBroker: {
    labelPlural: 'COMMON:MSG_LNB_MENU_14',
    label: 'COMMON:MSG_LNB_MENU_109',
  },
  ClusterServiceClass: {
    labelPlural: 'COMMON:MSG_LNB_MENU_15',
    label: 'COMMON:MSG_LNB_MENU_110',
  },
  ServiceInstance: {
    labelPlural: 'COMMON:MSG_LNB_MENU_17',
    label: 'COMMON:MSG_LNB_MENU_111',
  },
  ServiceBinding: {
    labelPlural: 'COMMON:MSG_LNB_MENU_18',
    label: 'COMMON:MSG_LNB_MENU_112',
  },
  CatalogServiceClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_19',
    label: 'COMMON:MSG_LNB_MENU_113',
  },
  Template: {
    labelPlural: 'COMMON:MSG_LNB_MENU_20',
    label: 'COMMON:MSG_LNB_MENU_114',
  },
  ClusterTemplate: {
    labelPlural: 'COMMON:MSG_LNB_MENU_104',
    label: 'COMMON:MSG_LNB_MENU_181',
  },
  TemplateInstance: {
    labelPlural: 'COMMON:MSG_LNB_MENU_21',
    label: 'COMMON:MSG_LNB_MENU_115',
  },
  Pod: {
    labelPlural: 'COMMON:MSG_LNB_MENU_23',
    label: 'COMMON:MSG_LNB_MENU_116',
  },
  Deployment: {
    labelPlural: 'COMMON:MSG_LNB_MENU_24',
    label: 'COMMON:MSG_LNB_MENU_117',
  },
  ReplicaSet: {
    labelPlural: 'COMMON:MSG_LNB_MENU_31',
    label: 'COMMON:MSG_LNB_MENU_124',
  },
  HorizontalPodAutoscaler: {
    labelPlural: 'COMMON:MSG_LNB_MENU_32',
    label: 'COMMON:MSG_LNB_MENU_125',
  },
  DaemonSet: {
    labelPlural: 'COMMON:MSG_LNB_MENU_30',
    label: 'COMMON:MSG_LNB_MENU_123',
  },
  StatefulSet: {
    labelPlural: 'COMMON:MSG_LNB_MENU_25',
    label: 'COMMON:MSG_LNB_MENU_118',
  },
  ConfigMap: {
    labelPlural: 'COMMON:MSG_LNB_MENU_27',
    label: 'COMMON:MSG_LNB_MENU_120',
  },
  Secret: {
    labelPlural: 'COMMON:MSG_LNB_MENU_26',
    label: 'COMMON:MSG_LNB_MENU_119',
  },
  Job: {
    labelPlural: 'COMMON:MSG_LNB_MENU_29',
    label: 'COMMON:MSG_LNB_MENU_122',
  },
  CronJob: {
    labelPlural: 'COMMON:MSG_LNB_MENU_28',
    label: 'COMMON:MSG_LNB_MENU_121',
  },
  VirtualMachine: {
    labelPlural: 'COMMON:MSG_LNB_MENU_33',
    label: 'COMMON:MSG_LNB_MENU_126',
  },
  VirtualMachineInstance: {
    labelPlural: 'COMMON:MSG_LNB_MENU_34',
    label: 'COMMON:MSG_LNB_MENU_127',
  },
  VirtualService: {
    labelPlural: 'COMMON:MSG_LNB_MENU_36',
    label: 'COMMON:MSG_LNB_MENU_128',
  },
  DestinationRule: {
    labelPlural: 'COMMON:MSG_LNB_MENU_37',
    label: 'COMMON:MSG_LNB_MENU_129',
  },
  EnvoyFilter: {
    labelPlural: 'COMMON:MSG_LNB_MENU_38',
    label: 'COMMON:MSG_LNB_MENU_130',
  },
  Gateway: {
    labelPlural: 'COMMON:MSG_LNB_MENU_39',
    label: 'COMMON:MSG_LNB_MENU_131',
  },
  Sidecar: {
    labelPlural: 'COMMON:MSG_LNB_MENU_40',
    label: 'COMMON:MSG_LNB_MENU_132',
  },
  ServiceEntry: {
    labelPlural: 'COMMON:MSG_LNB_MENU_41',
    label: 'COMMON:MSG_LNB_MENU_133',
  },
  RequestAuthentication: {
    labelPlural: 'COMMON:MSG_LNB_MENU_42',
    label: 'COMMON:MSG_LNB_MENU_134',
  },
  PeerAuthentication: {
    labelPlural: 'COMMON:MSG_LNB_MENU_43',
    label: 'COMMON:MSG_LNB_MENU_135',
  },
  AuthorizationPolicy: {
    labelPlural: 'COMMON:MSG_LNB_MENU_44',
    label: 'COMMON:MSG_LNB_MENU_136',
  },
  Service: {
    labelPlural: 'COMMON:MSG_LNB_MENU_47',
    label: 'COMMON:MSG_LNB_MENU_137',
  },
  Ingress: {
    labelPlural: 'COMMON:MSG_LNB_MENU_48',
    label: 'COMMON:MSG_LNB_MENU_138',
  },
  NetworkPolicy: {
    labelPlural: 'COMMON:MSG_LNB_MENU_49',
    label: 'COMMON:MSG_LNB_MENU_139',
  },
  StorageClass: {
    labelPlural: 'COMMON:MSG_LNB_MENU_53',
    label: 'COMMON:MSG_LNB_MENU_142',
  },
  PersistentVolume: {
    labelPlural: 'COMMON:MSG_LNB_MENU_51',
    label: 'COMMON:MSG_LNB_MENU_140',
  },
  PersistentVolumeClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_52',
    label: 'COMMON:MSG_LNB_MENU_141',
  },
  Task: {
    labelPlural: 'COMMON:MSG_LNB_MENU_57',
    label: 'COMMON:MSG_LNB_MENU_144',
  },
  ClusterTask: {
    labelPlural: 'COMMON:MSG_LNB_MENU_94',
    label: 'COMMON:MSG_LNB_MENU_173',
  },
  TaskRun: {
    labelPlural: 'COMMON:MSG_LNB_MENU_58',
    label: 'COMMON:MSG_LNB_MENU_145',
  },
  Pipeline: {
    labelPlural: 'COMMON:MSG_LNB_MENU_59',
    label: 'COMMON:MSG_LNB_MENU_146',
  },
  PipelineRun: {
    labelPlural: 'COMMON:MSG_LNB_MENU_60',
    label: 'COMMON:MSG_LNB_MENU_147',
  },
  Approval: {
    labelPlural: 'COMMON:MSG_LNB_MENU_61',
    label: 'COMMON:MSG_LNB_MENU_148',
  },
  PipelineResource: {
    labelPlural: 'COMMON:MSG_LNB_MENU_62',
    label: 'COMMON:MSG_LNB_MENU_149',
  },
  IntegrationJob: {
    labelPlural: 'COMMON:MSG_LNB_MENU_185',
    label: 'COMMON:MSG_LNB_MENU_186',
  },
  IntegrationConfig: {
    labelPlural: 'COMMON:MSG_LNB_MENU_183',
    label: 'COMMON:MSG_LNB_MENU_184',
  },
  Registry: {
    labelPlural: 'COMMON:MSG_LNB_MENU_187',
    label: 'COMMON:MSG_LNB_MENU_188',
  },
  ExternalRegistry: {
    labelPlural: 'COMMON:MSG_LNB_MENU_189',
    label: 'COMMON:MSG_LNB_MENU_190',
  },
  ImageSigner: {
    labelPlural: 'COMMON:MSG_LNB_MENU_91',
    label: 'COMMON:MSG_LNB_MENU_170',
  },
  ImageSignRequest: {
    labelPlural: 'COMMON:MSG_LNB_MENU_92',
    label: 'COMMON:MSG_LNB_MENU_171',
  },
  SignerPolicy: {
    labelPlural: 'COMMON:MSG_LNB_MENU_96',
    label: 'COMMON:MSG_LNB_MENU_175',
  },
  Namespace: {
    labelPlural: 'COMMON:MSG_LNB_MENU_3',
    label: 'COMMON:MSG_LNB_MENU_106',
  },
  NamespaceClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_103',
    label: 'COMMON:MSG_LNB_MENU_180',
  },
  LimitRange: {
    labelPlural: 'COMMON:MSG_LNB_MENU_81',
    label: 'COMMON:MSG_LNB_MENU_162',
  },
  ResourceQuota: {
    labelPlural: 'COMMON:MSG_LNB_MENU_80',
    label: 'COMMON:MSG_LNB_MENU_161',
  },
  ResourceQuotaClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_102',
    label: 'COMMON:MSG_LNB_MENU_179',
  },
  CustomResourceDefinition: {
    labelPlural: 'COMMON:MSG_LNB_MENU_82',
    label: 'COMMON:MSG_LNB_MENU_163',
  },
  Node: {
    labelPlural: 'COMMON:MSG_LNB_MENU_100',
    label: 'COMMON:MSG_LNB_MENU_177',
  },
  Role: {
    labelPlural: 'COMMON:MSG_LNB_MENU_75',
    label: 'COMMON:MSG_LNB_MENU_157',
  },
  RoleBinding: {
    labelPlural: 'COMMON:MSG_LNB_MENU_76',
    label: 'COMMON:MSG_LNB_MENU_158',
  },
  ClusterRole: {
    labelPlural: 'MSG_DETAILS_TABDETAILS_DETAILS_124',
  },
  RoleBindingClaim: {
    labelPlural: 'COMMON:MSG_LNB_MENU_101',
    label: 'COMMON:MSG_LNB_MENU_178',
  },
  ClusterRoleBinding: {
    labelPlural: 'MSG_DETAILS_TABDETAILS_DETAILS_123',
  },
  ServiceAccount: {
    labelPlural: 'COMMON:MSG_LNB_MENU_74',
    label: 'COMMON:MSG_LNB_MENU_156',
  },
  PodSecurityPolicy: {
    labelPlural: 'COMMON:MSG_LNB_MENU_78',
    label: 'COMMON:MSG_LNB_MENU_160',
  },
};
