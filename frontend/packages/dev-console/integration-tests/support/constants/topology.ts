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
  EditApplicationGrouping = 'Edit Application Grouping',
  EditPodCount = 'Edit Pod Count',
  PassRollOuts = 'Pass Rollouts',
  AddHealthChecks = 'Add Health Checks',
  AddHorizontalPodAutoScaler = 'Add Horizontal Pod Autoscaler',
  AddStorage = 'Add Storage',
  EditUpdateStrategy = 'Edit Update Strategy',
  EditLabels = 'Edit Labels',
  EditDeployment = 'Edit Deployment',
  DeleteDeployment = 'Delete Deployment',
  EditAnnotations = 'Edit Annotations',
  MoveSink = 'Move Sink',
  EditSinkBinding = 'Edit Sink Binding',
  DeleteSinkBinding = 'Delete Sink Binding',
  DeleteService = 'Delete Service',
  EditHealthChecks = 'Edit Health Checks',
  HelmReleases = 'Helm Releases',
}
