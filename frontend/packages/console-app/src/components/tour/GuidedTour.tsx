import * as React from 'react';
import { TourContext } from './tour-context';
import TourCloseModal from './TourCloseModal';
import StepComponent from './StepComponent';

const GuidedTour: React.FC = () => {
  const { tourState, tour, totalSteps, onComplete } = React.useContext(TourContext);
  if (!tour) return null;
  const { intro, steps, end } = tour;
  const { stepNumber, closeTour, startTour, completedTour } = tourState;
  if (completedTour) {
    onComplete();
    return null;
  }
  if (closeTour) return <TourCloseModal />;
  if (startTour || stepNumber === 0)
    return (
      <StepComponent
        {...intro}
        showClose={false}
        showStepBadge={false}
        nextButtonText="Get Started"
        backButtonText="Skip tour"
      />
    );
  if (stepNumber > totalSteps)
    return (
      <StepComponent
        {...end}
        showClose={false}
        showStepBadge={false}
        nextButtonText="Okay, got it!"
      />
    );
  const step = steps[stepNumber - 1];
  return <StepComponent {...step} />;
};
export default GuidedTour;
