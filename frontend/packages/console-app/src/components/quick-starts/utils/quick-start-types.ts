export type QuickStart = {
  iconURL: string;
  altIcon?: string;
  id: string;
  name: string;
  duration: number;
  description: string;
  prerequisites?: string[];
  introduction?: string;
  tasks?: QuickStartTask[];
  conclusion?: string;
};

export type QuickStartTask = {
  title?: string;
  description: string;
  review?: string;
  recapitulation?: {
    success?: string;
    failed?: string;
  };
  taskHelp?: string;
};

export type QuickStartStates = Record<string, QuickStartState>;

export type QuickStartState = {
  status: QuickStartStatus;
  currentTask: number;
  taskStatus?: QuickStartTaskStatus[];
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
