import { GuidedTourStatus } from './guided-tour-status';

export type GuidedTourItem = {
  iconURL: string;
  altIcon?: string;
  id: string;
  name: string;
  duration: number;
  description: string;
  prerequisites?: string[];
};

export type TourStatus = {
  active?: boolean;
  status: GuidedTourStatus;
};

export type GuidedTourCatalogItem = GuidedTourItem &
  TourStatus & {
    unmetPrerequisite?: boolean;
  };

export type GuidedTourState = {};
