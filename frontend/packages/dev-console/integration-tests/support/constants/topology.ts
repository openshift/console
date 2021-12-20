export enum displayOptions {
  PodCount = 'Pod Count',
  Labels = 'Labels',
  ApplicationGroupings = 'Application Groupings',
  HelmReleases = 'Helm Releases',
  KnativeServices = 'Knative Services',
  ConnectivityMode = 'Connectivity',
  ConsumptionMode = 'Consumption',
}

export enum nodeActions {
  EditApplicationGrouping = 'Edit Application grouping',
  EditPodCount = 'Edit Pod count',
  PauseRollOuts = 'Pause rollouts',
  AddHealthChecks = 'Add Health Checks',
  AddHorizontalPodAutoScaler = 'Add HorizontalPodAutoscaler',
  AddStorage = 'Add storage',
  EditUpdateStrategy = 'Edit update strategy',
  EditLabels = 'Edit labels',
  EditDeployment = 'Edit Deployment',
  EditDeploymentConfig = 'Edit DeploymentConfig',
  EditResourceLimits = 'Edit resource limits',
  DeleteDeployment = 'Delete Deployment',
  DeleteDeploymentConfig = 'Delete DeploymentConfig',
  EditAnnotations = 'Edit annotations',
  MoveSink = 'Move sink',
  EditSinkBinding = 'Edit SinkBinding',
  DeleteSinkBinding = 'Delete SinkBinding',
  DeleteService = 'Delete Service',
  EditService = 'Edit Service',
  EditHealthChecks = 'Edit Health Checks',
  HelmReleases = 'Helm Releases',
  SetTrafficDistribution = 'Set traffic distribution',
  AddSubscription = 'Add Subscription',
  EditInMemoryChannel = 'Edit InMemoryChannel',
  DeleteInMemoryChannel = 'Delete InMemoryChannel',
  EditRevision = 'Edit Revision',
  DeleteRevision = 'Delete Revision',
  MakeServerless = 'Make Serverless',
}

export enum applicationGroupingsActions {
  DeleteApplication = 'Delete Application',
  AddtoApplication = 'Add to Application',
}

export enum authenticationTypes {
  ImageRegistryCredentials = 'Image registry credentials',
  UploadConfigurationFile = 'Upload configuration file',
}

export enum addToApplicationGroupings {
  // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
  FromGit = 'From Git',
  ContainerImage = 'Container Image',
  // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
  FromDockerfile = 'From Dockerfile',
  // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
  FromDevfile = 'From Devfile',
  UploadJarfile = 'Upload JAR file',
  EventSource = 'Event Source',
  Channel = 'Channel',
}

export enum sideBarTabs {
  Details = 'Details',
  Resources = 'Resources',
  ReleaseNotes = 'Release notes',
  Observe = 'Observe',
}
