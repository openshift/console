import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox } from '@console/internal/components/utils';
import { GuidedTourCatalogItem } from './utils/guided-tour-typings';
import GuidedTourItem from './GuidedTourItem';
import { setActiveGuidedTour } from '../../redux/actions/guided-tour-actions';
import './GuidedTourCatalog.scss';
import { RootState } from '@console/internal/redux';
import {
  getActiveTourID,
  isGuidedTourDrawerExpanded,
} from '../../redux/reducers/guided-tour-reducer';

type StateProps = {
  isExpanded?: boolean;
  activeTourID?: string;
};

type DispatchProps = {
  onClick?: (tourId: string) => void;
};

type OwnProps = {
  tours: GuidedTourCatalogItem[];
};

type GuidedTourCatalogProps = OwnProps & DispatchProps & StateProps;

const GuidedTourCatalog: React.FC<GuidedTourCatalogProps> = ({
  tours,
  isExpanded,
  activeTourID,
  onClick,
}) => (
  <div className="oc-guided-tour-catalog">
    {!tours || tours.length === 0 ? (
      <EmptyBox label="Guided Tours" />
    ) : (
      <Gallery hasGutter>
        {tours.map((tour) => (
          <GalleryItem key={tour.name}>
            <GuidedTourItem
              {...tour}
              onClick={() => onClick(!isExpanded || tour.id !== activeTourID ? tour.id : '')}
            />
          </GalleryItem>
        ))}
      </Gallery>
    )}
  </div>
);

const mapStateToProps = (state: RootState): StateProps => ({
  isExpanded: isGuidedTourDrawerExpanded(state),
  activeTourID: getActiveTourID(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onClick: (tourId: string) => dispatch(setActiveGuidedTour(tourId)),
});

// exposed for testing
export const InternalGuidedTourCatalog = GuidedTourCatalog;

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps,
)(GuidedTourCatalog);
