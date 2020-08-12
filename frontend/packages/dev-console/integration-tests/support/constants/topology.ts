export enum displayOptions {
  PodCount = 'Pod Count',
  Labels = 'Labels',
  ApplicationGroupings = 'Application Groupings'
}

export enum nodeActions {
  EditApplicatoinGrouping = 'Edit Application Grouping',
  EditPodCount = 'Edit Pod Count',
  PassRollouts = 'Pass Rollouts',
  AddHealthChecks = 'Add Health Checks',
  AddHorizontalPodAutoscaler = 'Add Horizontal Pod Autoscaler',
  AddStorage = 'Add Storage',
  EditUpdateStrategy = 'Edit Update Strategy',
  EditLabels = 'Edit Labels',
  EditDeployment = 'Edit Deployment',
  DeleteDeployment = 'Delete Deployment',
  EditAnnotations = 'Edit Annotations'
}