type ErrorDetails = {
  title: string;
};

export type ErrorDetailsWithLogName = ErrorDetails & {
  containerName: string;
  podName: string;
};
export type ErrorDetailsWithStaticLog = ErrorDetails & {
  staticMessage: string;
};

export type CombinedErrorDetails = ErrorDetailsWithLogName | ErrorDetailsWithStaticLog;

export enum SucceedConditionReason {
  PipelineRunCancelled = 'StoppedRunFinally',
  PipelineRunStopped = 'CancelledRunFinally',
  TaskRunCancelled = 'TaskRunCancelled',
  Cancelled = 'Cancelled',
  PipelineRunStopping = 'PipelineRunStopping',
  PipelineRunPending = 'PipelineRunPending',
  TaskRunStopping = 'TaskRunStopping',
  CreateContainerConfigError = 'CreateContainerConfigError',
  ExceededNodeResources = 'ExceededNodeResources',
  ExceededResourceQuota = 'ExceededResourceQuota',
  ConditionCheckFailed = 'ConditionCheckFailed',
}

export enum ComputedStatus {
  Cancelling = 'Cancelling',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'In Progress' = 'In Progress',
  FailedToStart = 'FailedToStart',
  PipelineNotStarted = 'PipelineNotStarted',
  Skipped = 'Skipped',
  Cancelled = 'Cancelled',
  Pending = 'Pending',
  Idle = 'Idle',
  Other = '-',
}
