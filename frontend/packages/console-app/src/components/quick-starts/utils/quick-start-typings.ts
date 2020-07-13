import { QuickStartStatus as Status, TaskStatus } from './quick-start-status';

export type QuickStartItem = {
  iconURL: string;
  altIcon?: string;
  id: string;
  name: string;
  duration: number;
  description: string;
  prerequisites?: string[];
  introduction?: string;
  tasks?: QuickStartTaskItem[];
  conclusion?: string;
};

export type QuickStartTaskItem = {
  title?: string;
  description: string;
  review?: string;
  recapitulation?: {
    success?: string;
    failed?: string;
  };
  taskHelp?: string;
};

export type QuickStartStatus = {
  active?: boolean;
  status: string;
};

export type QuickStartCatalogItem = QuickStartItem &
  QuickStartStatus & {
    unmetPrerequisite?: boolean;
  };

export type QuickStartState = {
  tourStatus: Status;
  taskStatus?: TaskStatus[];
};
