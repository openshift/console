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
    pipelineOperator = 'Pipeline Operator',
    serverlessOperator = 'Serverless Operator',
    virtualizationOperator = 'Virtualization Operator',
    knativeCamelOperator = 'knative Apache Camel Operator',
    eclipseCheOperator = 'Eclipse Che'
  }