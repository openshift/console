export type QuickStartItem = {
  iconURL: string;
  altIcon?: string;
  id: string;
  name: string;
  duration: number;
  description: string;
  prerequisites?: string[];
};

export type QuickStartStatus = {
  active?: boolean;
  status: string;
};

export type QuickStartCatalogItem = QuickStartItem &
  QuickStartStatus & {
    unmetPrerequisite?: boolean;
  };

export type QuickStartState = {};
