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
}

export enum authenticationType {
  BasicAuthentication = 'Basic Authentication',
  SSHKey = 'SSHKey',
}

export enum resources {
  DeploymentConfigs = 'Deployment Configs',
  BuildConfigs = 'Build Configs',
  Services = 'Services',
  ImageStreams = 'Image Streams',
  Routes = 'Routes',
}
