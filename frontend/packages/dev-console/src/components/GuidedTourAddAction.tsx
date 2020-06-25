import * as React from 'react';
import { getGuidedToursWithStatus } from '@console/app/src/components/guided-tours/utils/guided-tour-utils';
import GuidedTourTile from './GuidedTourTile';

const GuidedTourAddAction: React.FC = () => {
  const guidedTourList = getGuidedToursWithStatus();
  return guidedTourList.length > 0 ? <GuidedTourTile tours={guidedTourList} /> : null;
};

export default GuidedTourAddAction;
