import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox } from '@console/internal/components/utils';
import { QuickStartCatalogItem } from './utils/quick-start-typings';
import QuickStartItem from './QuickStartItem';
import { setActiveQuickStart } from '../../redux/actions/quick-start-actions';
import { RootState } from '@console/internal/redux';
import {
  getActiveQuickStartID,
  isQuickStartDrawerExpanded,
} from '../../redux/reducers/quick-start-reducer';
import './QuickStartCatalog.scss';

type StateProps = {
  isExpanded?: boolean;
  activeQuickStartID?: string;
};

type DispatchProps = {
  onClick?: (QuickStartID: string) => void;
};

type OwnProps = {
  quickStarts: QuickStartCatalogItem[];
};

type QuickStartCatalogProps = OwnProps & DispatchProps & StateProps;

const QuickStartCatalog: React.FC<QuickStartCatalogProps> = ({
  quickStarts,
  isExpanded,
  activeQuickStartID,
  onClick,
}) => (
  <div className="oc-quick-start-catalog">
    {!quickStarts || quickStarts.length === 0 ? (
      <EmptyBox label="Quick Starts" />
    ) : (
      <Gallery hasGutter>
        {quickStarts.map((quickStart) => (
          <GalleryItem key={quickStart.name}>
            <QuickStartItem
              {...quickStart}
              onClick={() =>
                onClick(!isExpanded || quickStart.id !== activeQuickStartID ? quickStart.id : '')
              }
            />
          </GalleryItem>
        ))}
      </Gallery>
    )}
  </div>
);

const mapStateToProps = (state: RootState): StateProps => ({
  isExpanded: isQuickStartDrawerExpanded(state),
  activeQuickStartID: getActiveQuickStartID(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onClick: (QuickStartID: string) => dispatch(setActiveQuickStart(QuickStartID)),
});

// exposed for testing
export const InternalQuickStartCatalog = QuickStartCatalog;

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps,
)(QuickStartCatalog);
