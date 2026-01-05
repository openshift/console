import type { FC } from 'react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import StepComponent from './StepComponent';
import { TourContext } from './tour-context';

const GuidedTour: FC = () => {
  const { tourState, tour, totalSteps, onComplete } = useContext(TourContext);
  const { t } = useTranslation();
  if (!tour) return null;
  const { intro, steps, end } = tour;
  const { stepNumber, startTour, completedTour } = tourState || {};
  const currentStepNumber = stepNumber || 0;

  if (completedTour) {
    onComplete?.();
    return null;
  }
  if (startTour || currentStepNumber === 0)
    return (
      <StepComponent
        {...intro}
        showStepBadge={false}
        nextButtonText={t('console-app~Launch tour')}
        backButtonText={t('console-app~Skip tour')}
      />
    );
  if (currentStepNumber && totalSteps && currentStepNumber > totalSteps)
    return (
      <StepComponent
        {...end}
        showStepBadge={false}
        nextButtonText={t('console-app~Okay, got it!')}
        backButtonText={t('console-app~Back')}
      />
    );
  const step = steps?.[currentStepNumber - 1];
  return (
    <StepComponent
      {...step}
      nextButtonText={t('console-app~Next')}
      backButtonText={t('console-app~Back')}
    />
  );
};
export default GuidedTour;
