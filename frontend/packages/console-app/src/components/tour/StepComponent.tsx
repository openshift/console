import * as React from 'react';
import { TourContext } from './tour-context';
import { TourActions } from './const';
import TourStepComponent from './TourStepComponent';
import { StepContent } from './type';

type StepComponentProps = {
  heading: string;
  content: StepContent;
  selector?: string;
  placement?: string;
  showClose?: boolean;
  showStepBadge?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
};

const StepComponent: React.FC<StepComponentProps> = ({
  heading,
  content,
  selector,
  placement,
  nextButtonText = 'Next',
  backButtonText = 'Back',
  showClose = true,
  showStepBadge = true,
}) => {
  const {
    tourDispatch,
    totalSteps,
    tourState: { stepNumber: step },
  } = React.useContext(TourContext);
  return (
    <TourStepComponent
      step={step}
      content={content}
      heading={heading}
      selector={selector}
      placement={placement}
      showClose={showClose}
      totalSteps={totalSteps}
      showStepBadge={showStepBadge}
      nextButtonText={nextButtonText}
      backButtonText={backButtonText}
      onClose={() => tourDispatch(TourActions.pause)}
      onNext={() =>
        step > totalSteps ? tourDispatch(TourActions.complete) : tourDispatch(TourActions.next)
      }
      onBack={() => (step === 0 ? tourDispatch(TourActions.pause) : tourDispatch(TourActions.back))}
    />
  );
};

export default StepComponent;
