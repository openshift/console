import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TourContext } from './tour-context';
import StepComponent from './StepComponent';

const GuidedTour: React.FC = () => {
  const { tourState, tour, totalSteps, onComplete } = React.useContext(TourContext);
  const { t } = useTranslation();
  if (!tour) return null;
  const { intro, steps, end } = tour;
  const { stepNumber, startTour, completedTour } = tourState;

  if (completedTour) {
    onComplete();
    return null;
  }
  if (startTour || stepNumber === 0)
    return (
      <StepComponent
        {...intro}
        showStepBadge={false}
        nextButtonText={t('tour~Get Started')}
        backButtonText={t('tour~Skip tour')}
      />
    );
  if (stepNumber > totalSteps)
    return (
      <StepComponent
        {...end}
        showClose={false}
        showStepBadge={false}
        nextButtonText={t('tour~Okay, got it!')}
        backButtonText={t('tour~Back')}
      />
    );
  const step = steps[stepNumber - 1];
  return (
    <StepComponent {...step} nextButtonText={t('tour~Next')} backButtonText={t('tour~Back')} />
  );
};
export default GuidedTour;
