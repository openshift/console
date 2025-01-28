import * as React from 'react';
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
};

const StepComponent: React.FC<StepComponentProps> = ({
  heading,
  content,
  selector,
  placement,
  nextButtonText,
  backButtonText,
  showStepBadge = true,
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
      content={content}
      heading={heading}
      selector={selector}
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
