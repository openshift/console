export enum addOptions {
  Git = 'From Git',
  ContainerImage = 'Container Image',
  DockerFile = 'From Dockerfile',
  YAML = 'YAML',
  DeveloperCatalog = 'From Catalog',
  Database = 'Database',
  OperatorBacked = 'Operator Backed',
  HelmChart = 'Helm Chart',
  Pipeline = 'Pipeline',
  EventSource = 'Event Source',
  DevFile = 'From Devfile',
  Channel = 'Channel',
  UploadJARFile = 'Upload JAR file',
}

export enum buildConfigOptions {
  webhookBuildTrigger = 'Configure a webhook build trigger',
  automaticBuildImage = 'Automatically build a new image when the builder image changes',
  launchBuildOnCreatingBuildConfig = 'Launch the first build when the build configuration is created',
}

export enum resourceTypes {
  Deployment = 'Deployment',
  DeploymentConfig = 'Deployment Config',
  knativeService = 'knative',
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

export enum catalogCards {
  mariaDB = 'MariaDB',
  dotnetCoreExample = '.NET Core Example',
  cakePhp = 'CakePHP + MySQL',
  nodeJs = 'Node.js',
  nodeJsPostgreSQL = 'Node.js + PostgreSQL (Ephemeral)',
  apacheHTTPServer = 'Apache HTTP Server',
  nginxHTTPServer = 'Nginx HTTP server and a reverse proxy',
  jenkins = 'Jenkins',
  knativeKafka = 'Knative Kafka',
  helmNodejs = 'Nodejs Ex K v0.2.1',
}

export enum catalogTypes {
  OperatorBacked = 'Operator Backed',
  HelmCharts = 'Helm Charts',
  BuilderImage = 'Builder Image',
  Template = 'Template',
  ServiceClass = 'Service Class',
  ManagedServices = 'Managed Services',
  EventSources = 'Event Sources',
}

export enum builderImages {
  Perl = 'Perl',
  PHP = 'PHP',
  Nginx = 'Nginx',
  Httpd = 'Httpd',
  NETCore = '.NET Core',
  Go = 'Go',
  Ruby = 'Ruby',
  Python = 'Python',
  Java = 'Java',
  NodeJs = 'Node.js',
}

export enum eventSourceCards {
  ApiServerSource = 'Api Server Source',
  ContainerSource = 'Container Source',
  PingSource = 'Ping Source',
  SinkBinding = 'Sink Binding',
}
