export type QuickStart = {
  iconURL: string;
  altIcon?: string;
  id: string;
  name: string;
  duration: number;
  description: string;
  prerequisites?: string;
  introduction?: string;
  tasks?: QuickStartTask[];
  conclusion?: string;
  nextQuickStart?: string;
  version?: string | number;
};

export type QuickStartTask = {
  title?: string;
  description: string;
  review?: QuickStartTaskReview;
  recapitulation?: {
    success?: string;
    failed?: string;
  };
};

export type QuickStartTaskReview = {
  instructions: string;
  taskHelp: string;
};

export type AllQuickStartStates = Record<string, QuickStartState>;

export type QuickStartState = {
  status: QuickStartStatus;
  taskNumber: number;
  allTaskStatuses?: QuickStartTaskStatus[];
};

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
