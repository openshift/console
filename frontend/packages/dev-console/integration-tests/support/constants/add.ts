/* eslint-disable @typescript-eslint/naming-convention */

export enum addOptions {
  Broker = 'Broker',
  Channel = 'Channel',
  ContainerImage = 'Container Image',
  CreateServerlessFunction = 'Create Serverless function',
  Database = 'Database',
  DeveloperCatalog = 'From Catalog',
  Events = 'Events',
  EventSink = 'Event Sink',
  EventSource = 'Event Source',
  HelmChart = 'Helm Chart',
  HelmChartRepositories = 'Helm Chart Repositories',
  ImportFromGit = 'Import From Git',
  OperatorBacked = 'Operator Backed',
  Pipeline = 'Pipeline',
  Samples = 'Samples',
  Sharing = 'Sharing',
  UploadJARFile = 'Upload JAR file',
  YAML = 'YAML',
}

export enum buildConfigOptions {
  webhookBuildTrigger = 'Configure a webhook build trigger',
  automaticBuildImage = 'Automatically build a new image when the builder image changes',
  launchBuildOnCreatingBuildConfig = 'Launch the first build when the build configuration is created',
}

export enum resourceTypes {
  Deployment = 'Deployment',
  DeploymentConfig = 'Deployment Config',
  knativeService = 'Knative',
}

export enum gitAdvancedOptions {
  Routing = 'Developer Perspective',
  BuildConfig = ' Administrator Perspective',
  Deployment = 'Deployment',
  Scaling = 'Scaling',
  ResourceLimits = 'Resource Limits',
  Labels = 'Labels',
  HealthChecks = 'Health Checks',
  Resources = 'Resources',
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
  helmNodejs = 'Nodejs',
}

export enum catalogTypes {
  OperatorBacked = 'Operator Backed',
  HelmCharts = 'Helm Charts',
  BuilderImage = 'Builder Image',
  Template = 'Template',
  ServiceClass = 'Service Class',
  ManagedServices = 'Managed Services',
  EventSources = 'Event Sources',
  EventSinks = 'Event Sinks',
}

export enum builderImages {
  Perl = 'perl',
  PHP = 'php',
  Nginx = 'nginx',
  Httpd = 'httpd',
  NETCore = 'dotnet',
  Go = 'golang',
  Ruby = 'ruby',
  Python = 'python',
  Java = 'java',
  NodeJs = 'nodejs',
}

export enum eventSourceCards {
  ApiServerSource = 'ApiServerSource',
  ContainerSource = 'ContainerSource',
  PingSource = 'PingSource',
  SinkBinding = 'SinkBinding',
}
