import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TourContext } from './tour-context';
import { TourActions } from './const';

type GuidedTourMastheadTriggerProps = {
  className?: string;
};

const GuidedTourMastheadTrigger: React.FC<GuidedTourMastheadTriggerProps> = ({ className }) => {
  const { tourDispatch, tour } = React.useContext(TourContext);
  const { t } = useTranslation();

  if (!tour) return null;
  return (
    <button
      className={className}
      type="button"
      onClick={() => tourDispatch({ type: TourActions.start })}
    >
      {t('tour~Guided Tour')}
    </button>
  );
};

export default GuidedTourMastheadTrigger;
