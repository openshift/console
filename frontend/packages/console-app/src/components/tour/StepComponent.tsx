import * as React from 'react';
import { TourContext } from './tour-context';
import { TourActions } from './const';
import TourStepComponent from './TourStepComponent';
import { StepContentType } from './type';

type StepComponentProps = {
  heading: string;
  content: StepContentType;
  selector?: string;
  placement?: string;
  showClose?: boolean;
  showStepBadge?: boolean;
  nextButtonText: string;
  backButtonText: string;
};

const StepComponent: React.FC<StepComponentProps> = ({
  heading,
  content,
  selector,
  placement,
  nextButtonText,
  backButtonText,
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
