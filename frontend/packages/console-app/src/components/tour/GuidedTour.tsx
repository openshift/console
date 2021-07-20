import * as React from 'react';
import { useTranslation } from 'react-i18next';
import StepComponent from './StepComponent';
import { TourContext } from './tour-context';

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
        nextButtonText={t('console-app~Get started')}
        backButtonText={t('console-app~Skip tour')}
      />
    );
  if (stepNumber > totalSteps)
    return (
      <StepComponent
        {...end}
        showClose={false}
        showStepBadge={false}
        nextButtonText={t('console-app~Okay, got it!')}
        backButtonText={t('console-app~Back')}
      />
    );
  const step = steps[stepNumber - 1];
  return (
    <StepComponent
      {...step}
      nextButtonText={t('console-app~Next')}
      backButtonText={t('console-app~Back')}
    />
  );
};
export default GuidedTour;
