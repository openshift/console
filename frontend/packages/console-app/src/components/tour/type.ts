import { ReactNode } from 'react';

export type StepContent = ReactNode | string;

export type Step = {
  access?: () => boolean;
  flags?: string[];
  placement?: string;
  heading: string;
  content: StepContent;
  selector?: string;
  showStepBadge?: boolean;
  showClose?: boolean;
};

export type TourDataType = {
  intro: Step;
  steps: Step[];
  end: Step;
};
