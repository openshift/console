export enum addOptions {
  Git = 'From Git',
  ContainerImage = 'Container Image',
  DockerFile = 'From Dockerfile',
  YAML = 'YAML',
  Catalog = 'From Catalog',
  Database = 'Database',
  OperatorBacked = 'Operator Backed',
  HelmChart = 'Helm Chart',
  Pipeline = 'Pipeline',
  EventSource = 'Event Source',
}

export enum resourceTypes {
  Deployment = 'Deployment',
  DeploymentConfig = 'Deployment Config',
  KnativeService = 'Knative Service',
}

export enum gitAdvancedOptions {
  Routing = 'Developer Perspective',
  BuildConfig = ' Administrator Perspective',
  Deployment = 'Deployment',
  Scaling = 'Scaling',
  ResourceLimits = 'Resource Limits',
  Labels = 'Labels',
  HealthChecks = 'Health Checks',
}
