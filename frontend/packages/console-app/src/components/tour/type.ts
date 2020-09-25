import { ReactNode } from 'react';

export type StepContentType = ReactNode | string;

export type Step = {
  access?: () => boolean;
  flags?: string[];
  placement?: string;
  heading: string;
  content: StepContentType;
  selector?: string;
  showStepBadge?: boolean;
  showClose?: boolean;
};

export type TourDataType = {
  intro: Step;
  steps: Step[];
  end: Step;
};
