export enum devNavigationMenu {
  Add = '+Add',
  Topology = ' Topology',
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
  Developer = 'Developer Perspective',
  Administrator = ' Administrator Perspective',
}

export enum operators {
  PipelinesOperator = 'Pipeline',
  ServerlessOperator = 'Serverless',
  VirtualizationOperator = 'Virtualization',
  KnativeCamelOperator = 'Knative Apache Camel K',
  EclipseCheOperator = 'Eclipse Che',
}

export enum authenticationType {
  BasicAuthentication = 'Basic Authentication',
  SSHKey = 'SSHKey',
}
