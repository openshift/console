export enum StartedByLabel {
  user = 'pipeline.openshift.io/started-by',
  triggers = 'tekton.dev/eventlistener',
}

export enum PipelineResourceType {
  '' = 'Select resource type',
  git = 'Git',
  image = 'Image',
  cluster = 'Cluster',
  storage = 'Storage',
}

export enum VolumeTypes {
  EmptyDirectory = 'Empty Directory',
  ConfigMap = 'Config Map',
  Secret = 'Secret',
  PVC = 'PVC',
}
