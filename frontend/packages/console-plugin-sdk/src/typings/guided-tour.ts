import { Extension } from './base';
import { TourDataType } from '@console/app/src/components/tour';

namespace ExtensionProperties {
  export interface GuidedTour {
    perspective: string;
    tour: TourDataType;
  }
}

export interface GuidedTour extends Extension<ExtensionProperties.GuidedTour> {
  type: 'GuidedTour';
}

export const isGuidedTour = (e: Extension): e is GuidedTour => {
  return e.type === 'GuidedTour';
};
