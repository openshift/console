import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox } from '@console/internal/components/utils';
import * as QuickStartActions from '../../../redux/actions/quick-start-actions';
import {
  getActiveQuickStartID,
  getQuickStartStates,
} from '../../../redux/reducers/quick-start-reducer';
import { QuickStart, QuickStartStates, QuickStartStatus } from '../utils/quick-start-types';
import QuickStartCatalogItem from './QuickStartCatalogItem';

import './QuickStartCatalog.scss';

type StateProps = {
  activeQuickStartID?: string;
  quickStartStates?: QuickStartStates;
};

type DispatchProps = {
  setActiveQuickStart?: (quickStartID: string) => void;
};

type OwnProps = {
  quickStarts: QuickStart[];
};

type QuickStartCatalogProps = OwnProps & DispatchProps & StateProps;

const QuickStartCatalog: React.FC<QuickStartCatalogProps> = ({
  quickStarts,
  activeQuickStartID,
  quickStartStates,
  setActiveQuickStart,
}) => {
  return (
    <div className="co-quick-start-catalog">
      {!quickStarts || quickStarts.length === 0 ? (
        <EmptyBox label="Quick Starts" />
      ) : (
        <Gallery className="co-quick-start-catalog__gallery" hasGutter>
          {quickStarts.map((quickStart) => (
            <GalleryItem key={quickStart.id}>
              <QuickStartCatalogItem
                quickStart={quickStart}
                isActive={quickStart.id === activeQuickStartID}
                status={quickStartStates?.[quickStart.id]?.status ?? QuickStartStatus.NOT_STARTED}
                onClick={() => setActiveQuickStart(quickStart.id)}
              />
            </GalleryItem>
          ))}
        </Gallery>
      )}
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  activeQuickStartID: getActiveQuickStartID(state),
  quickStartStates: getQuickStartStates(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setActiveQuickStart: (quickStartID: string) =>
    dispatch(QuickStartActions.setActiveQuickStart(quickStartID)),
});

// exposed for testing
export const InternalQuickStartCatalog = QuickStartCatalog;

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps,
)(QuickStartCatalog);
