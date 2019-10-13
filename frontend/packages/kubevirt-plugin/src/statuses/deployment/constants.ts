export enum DeploymentStatus {
  PROGRESSING = 'PROGRESSING',
  ROLLOUT_COMPLETE = 'ROLLOUT_COMPLETE',
  FAILED = 'FAILED',
  UNKNOWN = 'UNKNOWN',
}

export const DEPLOYMENT_ALL_PROGRESS = [DeploymentStatus.PROGRESSING];
export const DEPLOYMENT_ALL_ERROR = [DeploymentStatus.FAILED];
