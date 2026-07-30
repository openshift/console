import type { FC } from 'react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import StepComponent from './StepComponent';
import { TourContext } from './tour-context';

const GuidedTour: FC = () => {
  const { tourState, tour, totalSteps, onComplete } = useContext(TourContext);
  const { t } = useTranslation('console-app');
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
        nextButtonText={t('Launch tour')}
        backButtonText={t('Skip tour')}
      />
    );
  if (currentStepNumber && totalSteps && currentStepNumber > totalSteps)
    return (
      <StepComponent
        {...end}
        showStepBadge={false}
        nextButtonText={t('Okay, got it!')}
        backButtonText={t('Back')}
      />
    );
  const step = steps?.[currentStepNumber - 1];
  return <StepComponent {...step} nextButtonText={t('Next')} backButtonText={t('Back')} />;
};
export default GuidedTour;
