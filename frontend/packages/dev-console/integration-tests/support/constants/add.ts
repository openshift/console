export enum addOptions {
  // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
  Git = 'From Git',
  ContainerImage = 'Container Image',
  // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
  DockerFile = 'From Dockerfile',
  YAML = 'YAML',
  DeveloperCatalog = 'From Catalog',
  Database = 'Database',
  OperatorBacked = 'Operator Backed',
  HelmChart = 'Helm Chart',
  Pipeline = 'Pipeline',
  EventSource = 'Event Source',
  // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
  DevFile = 'From Devfile',
  Channel = 'Channel',
  UploadJARFile = 'Upload JAR file',
  Broker = 'Broker',
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
  ApiServerSource = 'Api Server Source',
  ContainerSource = 'Container Source',
  PingSource = 'Ping Source',
  SinkBinding = 'Sink Binding',
}
