import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TourActions } from './const';
import { TourContext } from './tour-context';

type GuidedTourMastheadTriggerProps = {
  className?: string;
};

const GuidedTourMastheadTrigger: React.FC<GuidedTourMastheadTriggerProps> = React.forwardRef(
  ({ className }, ref: React.LegacyRef<HTMLButtonElement>) => {
    const { tourDispatch, tour } = React.useContext(TourContext);
    const { t } = useTranslation();

    if (!tour) return null;
    return (
      <button
        className={className}
        type="button"
        ref={ref}
        onClick={() => tourDispatch({ type: TourActions.start })}
      >
        {t('console-app~Guided tour')}
      </button>
    );
  },
);

export default GuidedTourMastheadTrigger;
