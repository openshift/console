export enum pipelineActions {
  Start = 'Start',
  AddTrigger = 'Add Trigger',
  EditLabels = 'Edit labels',
  RemoveTrigger = 'Remove Trigger',
  EditAnnotations = 'Edit annotations',
  EditPipeline = 'Edit Pipeline',
  DeletePipeline = 'Delete Pipeline',
  StartLastRun = 'Start Last Run',
  Rerun = 'Rerun',
  DeletePipelineRun = 'Delete PipelineRun',
  EditRepository = 'Edit Repository',
  DeleteRepository = 'Delete Repository',
}

export enum pipelineTabs {
  Pipelines = 'Pipelines',
  Repositories = 'Repositories',
}

export enum pipelineDetailsTabs {
  Details = 'Details',
  YAML = 'YAML',
  PipelineRuns = 'Pipeline Runs',
  Parameters = 'Parameters',
  Resources = 'Resources',
  Metrics = 'Metrics',
}

export enum repositoryDetailsTabs {
  Details = 'Details',
  YAML = 'YAML',
  PipelineRuns = 'Pipeline Runs',
}
