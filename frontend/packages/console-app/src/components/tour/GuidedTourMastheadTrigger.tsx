import { forwardRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { TourActions } from './const';
import { TourContext } from './tour-context';

type GuidedTourMastheadTriggerProps = {
  className?: string;
};

const GuidedTourMastheadTrigger = forwardRef<HTMLButtonElement, GuidedTourMastheadTriggerProps>(
  ({ className }, ref) => {
    const { tourDispatch, tour } = useContext(TourContext);
    const { t } = useTranslation();

    if (!tour) return null;
    return (
      <button
        className={className}
        type="button"
        ref={ref}
        onClick={() => tourDispatch({ type: TourActions.start })}
      >
        {t('console-app~Guided Tour')}
      </button>
    );
  },
);

export default GuidedTourMastheadTrigger;
