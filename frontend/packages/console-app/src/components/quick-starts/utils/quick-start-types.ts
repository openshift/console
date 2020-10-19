import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';

export type QuickStart = {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
  };
  spec: QuickStartSpec;
};

export type QuickStartSpec = {
  version: number;
  displayName: string;
  duration: number;
  iconURL: string;
  description: string;
  prerequisites?: string;
  introduction?: string;
  tasks?: QuickStartTask[];
  conclusion?: string;
  nextQuickStart?: string;
  accessReviewResources?: AccessReviewResourceAttributes[];
  flags?: {
    required?: string[];
    disallowed?: string[];
  };
};

export type QuickStartTask = {
  title?: string;
  description: string;
  review?: QuickStartTaskReview;
  recapitulation?: QuickStartTaskRecapitulation;
};

export type QuickStartTaskReview = {
  instructions: string;
  taskHelp: string;
};

export type QuickStartTaskRecapitulation = {
  success?: string;
  failed?: string;
};

export type AllQuickStartStates = Record<string, QuickStartState>;

export type QuickStartState = Record<string, string | number | QuickStartStatus>;

export enum QuickStartStatus {
  COMPLETE = 'Complete',
  IN_PROGRESS = 'In Progress',
  NOT_STARTED = 'Not started',
}

export enum QuickStartTaskStatus {
  INIT = 'Initial',
  REVIEW = 'Review',
  SUCCESS = 'Success',
  FAILED = 'Failed',
}
