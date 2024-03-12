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

export enum ApprovalStatus {
  Idle = 'idle',
  RequestSent = 'wait',
  PartiallyApproved = 'partiallyApproved',
  AlmostApproved = 'almostApproved',
  Accepted = 'true',
  Rejected = 'false',
  TimedOut = 'timeout',
  Unknown = 'unknown',
}

export enum CustomRunStatus {
  RunCancelled = 'RunCancelled',
}
