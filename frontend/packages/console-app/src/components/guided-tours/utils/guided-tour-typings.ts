export type GuidedTourItem = {
  iconURL: string;
  altIcon?: string;
  name: string;
  duration: number;
  description: string;
  prerequisites?: string[];
};

export type TourStatus = {
  active?: boolean;
  status: string;
};
