import type { ReactNode } from 'react';
import type { ModalVariant } from '@patternfly/react-core';

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
  expandableSelector?: string;
  introBannerLight?: ReactNode;
  introBannerDark?: ReactNode;
  modalVariant?: ModalVariant;
};

export type TourDataType = {
  intro: Step;
  steps: Step[];
  end: Step;
};
