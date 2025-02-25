/* eslint-disable @typescript-eslint/naming-convention */

export enum devNavigationMenu {
  Add = '+Add',
  Topology = 'Topology',
  Observe = 'Observe',
  Builds = 'Builds',
  ShipwrightBuilds = 'Shipwright Builds',
  BuildConfigs = 'BuildConfigs',
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
  Functions = 'Functions',
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
  BuildsForOpenshiftOperator = 'builds for Red Hat OpenShift Operator',
  DevWorkspaceOperator = 'DevWorkspace Operator',
}

export enum operatorNamespaces {
  PipelinesOperator = 'openshift-operators',
  ServerlessOperator = 'openshift-serverless',
  ShipwrightOperator = 'openshift-operators',
  BuildsForOpenshiftOperator = 'openshift-operators',
  WebTerminalOperator = 'openshift-operators',
  RedHatIntegrationCamelK = 'openshift-operators',
  DevWorkspaceOperator = 'openshift-operators',
}

export enum operatorSubscriptions {
  PipelinesOperator = 'openshift-pipelines-operator',
  ServerlessOperator = 'serverless-operator',
  ShipwrightOperator = 'shipwright-operator',
  BuildsForOpenshiftOperator = 'openshift-builds-operator',
  WebTerminalOperator = 'web-terminal',
  RedHatIntegrationCamelK = 'red-hat-camel-k',
  DevWorkspaceOperator = 'devworkspace-operator',
}

export enum operatorPackage {
  PipelinesOperator = 'openshift-pipelines-operator-rh',
  ServerlessOperator = 'serverless-operator',
  ShipwrightOperator = 'shipwright-operator',
  BuildsForOpenshiftOperator = 'openshift-builds-operator',
  WebTerminalOperator = 'web-terminal',
  RedHatIntegrationCamelK = 'red-hat-camel-k',
  DevWorkspaceOperator = 'devworkspace-operator',
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
