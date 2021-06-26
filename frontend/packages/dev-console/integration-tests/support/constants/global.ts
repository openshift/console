export enum devNavigationMenu {
  Add = '+Add',
  Topology = 'Topology',
  Monitoring = 'Monitoring',
  Builds = 'Builds',
  Search = 'Search',
  Helm = 'Helm',
  Project = 'Project',
  ProjectAccess = 'Project Access',
  Pipelines = 'Pipelines',
  ConfigMaps = 'Config Maps',
  Secrets = 'Secrets',
  GitOps = 'GitOps',
}

export enum switchPerspective {
  Developer = 'Developer',
  Administrator = 'Administrator',
}

export enum operators {
  PipelineOperator = 'Pipeline',
  ServerlessOperator = 'Serverless',
  VirtualizationOperator = 'Virtualization',
  KnativeCamelOperator = 'knative Apache Camel',
  EclipseCheOperator = 'Eclipse Che',
}
