import * as React from 'react';
import { TourContext } from './tour-context';
import { TourActions } from './const';
import TourStepComponent from './TourStepComponent';

const TourCloseModal = () => {
  const { tourDispatch } = React.useContext(TourContext);
  return (
    <TourStepComponent
      heading="Are you sure you want to leave?"
      showClose={false}
      showStepBadge={false}
      content="If you get stuck or need help, you can take this tour again by accessing it through the Help menu."
      onNext={() => tourDispatch(TourActions.complete)}
      onBack={() => tourDispatch(TourActions.resume)}
      nextButtonText="Close"
      backButtonText="Back to tour"
    />
  );
};

export default TourCloseModal;
