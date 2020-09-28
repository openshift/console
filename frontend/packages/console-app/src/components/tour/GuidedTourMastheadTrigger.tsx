import * as React from 'react';
import { TourContext } from './tour-context';
import { TourActions } from './const';

type GuidedTourMastheadTriggerProps = {
  className?: string;
};

const GuidedTourMastheadTrigger: React.FC<GuidedTourMastheadTriggerProps> = ({ className }) => {
  const { tourDispatch, tour } = React.useContext(TourContext);
  if (!tour) return null;
  return (
    <button
      className={className}
      type="button"
      onClick={() => tourDispatch({ type: TourActions.start })}
    >
      Guided Tour
    </button>
  );
};

export default GuidedTourMastheadTrigger;
