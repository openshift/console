import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox, LoadingBox } from '@console/internal/components/utils';
import * as QuickStartActions from '../../../redux/actions/quick-start-actions';
import {
  getActiveQuickStartID,
  getAllQuickStartStates,
} from '../../../redux/reducers/quick-start-reducer';
import { QuickStart, AllQuickStartStates } from '../utils/quick-start-types';
import { getQuickStartStatus } from '../utils/quick-start-utils';
import QuickStartTile from './QuickStartTile';

import './QuickStartCatalog.scss';

type StateProps = {
  activeQuickStartID?: string;
  allQuickStartStates?: AllQuickStartStates;
};

type DispatchProps = {
  setActiveQuickStart?: (quickStartID: string, totalTasks: number) => void;
};

type OwnProps = {
  quickStarts: QuickStart[];
};

type QuickStartCatalogProps = OwnProps & DispatchProps & StateProps;

const QuickStartCatalog: React.FC<QuickStartCatalogProps> = ({
  quickStarts,
  activeQuickStartID,
  allQuickStartStates,
  setActiveQuickStart,
}) => {
  if (!quickStarts) return <LoadingBox />;

  return quickStarts.length === 0 ? (
    <EmptyBox label="Quick Starts" />
  ) : (
    <Gallery className="co-quick-start-catalog__gallery" hasGutter>
      {quickStarts.map((quickStart) => {
        const {
          metadata: { name: id },
          spec: { tasks },
        } = quickStart;

        return (
          <GalleryItem key={id}>
            <QuickStartTile
              quickStart={quickStart}
              isActive={id === activeQuickStartID}
              status={getQuickStartStatus(allQuickStartStates, id)}
              onClick={() => setActiveQuickStart(id, tasks?.length)}
            />
          </GalleryItem>
        );
      })}
    </Gallery>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  activeQuickStartID: getActiveQuickStartID(state),
  allQuickStartStates: getAllQuickStartStates(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setActiveQuickStart: (quickStartID: string, totalTasks: number) =>
    dispatch(QuickStartActions.setActiveQuickStart(quickStartID, totalTasks)),
});

// exposed for testing
export const InternalQuickStartCatalog = QuickStartCatalog;

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps,
)(QuickStartCatalog);
