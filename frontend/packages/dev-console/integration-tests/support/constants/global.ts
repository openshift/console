export enum devNavigationMenu {
  Add = '+Add',
  Topology = 'Topology',
  Observe = 'Observe',
  Builds = 'Builds',
  Search = 'Search',
  Helm = 'Helm',
  Project = 'Project',
  ProjectAccess = 'Project Access',
  Pipelines = 'Pipelines',
  ConfigMaps = 'Config Maps',
  Secrets = 'Secrets',
  GitOps = 'GitOps',
  Environments = 'Environments',
  Routes = 'Routes',
  Deployments = 'Deployments',
  Consoles = 'Consoles',
}

export enum adminNavigationBar {
  Home = 'Home',
  Workloads = 'Workloads',
}

export enum switchPerspective {
  Developer = 'Developer',
  Administrator = 'Administrator',
}

export enum operators {
  PipelinesOperator = 'Red Hat OpenShift Pipelines',
  ServerlessOperator = 'Red Hat OpenShift Serverless',
  VirtualizationOperator = 'OpenShift Virtualization',
  RedHatIntegrationCamelK = 'Red Hat Integration - Camel K',
  ApacheCamelKOperator = 'Camel K Operator',
  KnativeApacheCamelOperator = 'Knative Apache Camel Operator',
  EclipseCheOperator = 'Eclipse Che',
  GitOpsOperator = 'Red Hat OpenShift GitOps',
  WebTerminalOperator = 'Web Terminal',
  ApacheKafka = 'Red Hat Integration - AMQ Streams',
  RedHatCodereadyWorkspaces = 'Red Hat CodeReady Workspaces',
  GitopsPrimer = 'gitops-primer',
  ServiceBinding = 'Service Binding Operator',
  CrunchyPostgresforKubernetes = 'Crunchy Postgres for Kubernetes',
  QuayContainerSecurity = 'Quay Container Security',
  ShipwrightOperator = 'Shipwright Operator',
  RedisOperator = 'Redis Operator',
  AMQStreams = 'AMQ Streams',
  RHOAS = 'RHOAS',
  Jaeger = 'Red Hat OpenShift distributed tracing platform',
}

export enum authenticationType {
  BasicAuthentication = 'Basic Authentication',
  SSHKey = 'SSHKey',
}

export enum resources {
  Deployments = 'Deployments',
  BuildConfigs = 'Build Configs',
  Builds = 'Builds',
  Services = 'Services',
  ImageStreams = 'Image Streams',
  Routes = 'Routes',
}
