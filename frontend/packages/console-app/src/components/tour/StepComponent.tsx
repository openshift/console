import * as React from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { TourActions } from './const';
import { TourContext } from './tour-context';
import TourStepComponent from './TourStepComponent';
import { StepContentType } from './type';

type StepComponentProps = {
  heading: string;
  content: StepContentType;
  selector?: string;
  placement?: string;
  showStepBadge?: boolean;
  nextButtonText: string;
  backButtonText: string;
  expandableSelector?: string;
  introBannerLight?: React.ReactNode;
  introBannerDark?: React.ReactNode;
  modalVariant?: ModalVariant;
};

const StepComponent: React.FC<StepComponentProps> = ({
  heading,
  content,
  expandableSelector,
  selector,
  placement,
  nextButtonText,
  backButtonText,
  showStepBadge = true,
  introBannerLight,
  introBannerDark,
  modalVariant,
}) => {
  const {
    tourDispatch,
    totalSteps,
    tourState: { stepNumber: step },
  } = React.useContext(TourContext);
  return (
    <TourStepComponent
      key={step}
      step={step}
      introBannerLight={introBannerLight}
      introBannerDark={introBannerDark}
      content={content}
      heading={heading}
      modalVariant={modalVariant}
      selector={selector}
      expandableSelector={expandableSelector}
      placement={placement}
      totalSteps={totalSteps}
      showStepBadge={showStepBadge}
      nextButtonText={nextButtonText}
      backButtonText={backButtonText}
      onClose={() => tourDispatch({ type: TourActions.complete })}
      onNext={() =>
        step > totalSteps
          ? tourDispatch({ type: TourActions.complete })
          : tourDispatch({ type: TourActions.next })
      }
      onBack={() =>
        step === 0
          ? tourDispatch({ type: TourActions.complete })
          : tourDispatch({ type: TourActions.back })
      }
    />
  );
};

export default StepComponent;
