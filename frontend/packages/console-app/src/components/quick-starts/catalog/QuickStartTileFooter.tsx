import * as React from 'react';
import { Dispatch, connect } from 'react-redux';
import { Flex, FlexItem, Button } from '@patternfly/react-core';
import { RootState } from '@console/internal/redux';
import * as QuickStartActions from '../../../redux/actions/quick-start-actions';
import { getActiveQuickStartID } from '../../../redux/reducers/quick-start-reducer';
import { QuickStartStatus } from '../utils/quick-start-types';

type StateProps = {
  activeQuickStartId?: string;
};

type DispatchProps = {
  setActiveQuickStart?: (quickStartID: string, totalTasks: number) => void;
  resetQuickStart?: (quickStartID: string, totalTasks: number) => void;
  setQuickStartStatus?: (quickStartId: string, quickStartStatus: QuickStartStatus) => void;
  setQuickStartTaskNumber?: (quickStartId: string, taskNumber: number) => void;
};

type QuickStartTileFooterProps = {
  quickStartId: string;
  status: string;
  totalTasks?: number;
};

type Props = QuickStartTileFooterProps & StateProps & DispatchProps;

const QuickStartTileFooter: React.FC<Props> = ({
  quickStartId,
  activeQuickStartId,
  status,
  totalTasks,
  setActiveQuickStart,
  setQuickStartStatus,
  resetQuickStart,
}) => {
  const startQuickStart = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!activeQuickStartId || activeQuickStartId !== quickStartId)
        setActiveQuickStart(quickStartId, totalTasks);
      setQuickStartStatus(quickStartId, QuickStartStatus.IN_PROGRESS);
    },
    [activeQuickStartId, quickStartId, setActiveQuickStart, setQuickStartStatus, totalTasks],
  );

  const restartQuickStart = React.useCallback(
    (e: React.SyntheticEvent) => {
      resetQuickStart(quickStartId, totalTasks);
      startQuickStart(e);
    },
    [quickStartId, resetQuickStart, startQuickStart, totalTasks],
  );

  return (
    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
      {status === QuickStartStatus.NOT_STARTED && (
        <FlexItem>
          <Button onClick={startQuickStart} variant="link" isInline>
            Start the tour
          </Button>
        </FlexItem>
      )}
      {status === QuickStartStatus.IN_PROGRESS && activeQuickStartId !== quickStartId && (
        <FlexItem>
          <Button variant="link" isInline>
            Resume the tour
          </Button>
        </FlexItem>
      )}
      {status === QuickStartStatus.COMPLETE && (
        <FlexItem>
          <Button onClick={restartQuickStart} variant="link" isInline>
            Start the tour
          </Button>
        </FlexItem>
      )}
      {status === QuickStartStatus.IN_PROGRESS && (
        <FlexItem>
          <Button onClick={restartQuickStart} variant="link" isInline>
            Restart the tour
          </Button>
        </FlexItem>
      )}
    </Flex>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  activeQuickStartId: getActiveQuickStartID(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setActiveQuickStart: (quickStartID: string, totalTasks: number) =>
    dispatch(QuickStartActions.setActiveQuickStart(quickStartID, totalTasks)),
  resetQuickStart: (quickStartID: string, totalTasks: number) =>
    dispatch(QuickStartActions.resetQuickStart(quickStartID, totalTasks)),
  setQuickStartStatus: (quickStartId: string, quickStartStatus: QuickStartStatus) =>
    dispatch(QuickStartActions.setQuickStartStatus(quickStartId, quickStartStatus)),
  setQuickStartTaskNumber: (quickStartId: string, taskNumber: number) =>
    dispatch(QuickStartActions.setQuickStartTaskNumber(quickStartId, taskNumber)),
});

export const InternalQuickStartTileFooter = QuickStartTileFooter; // for testing

export default connect<StateProps, DispatchProps, QuickStartTileFooterProps>(
  mapStateToProps,
  mapDispatchToProps,
)(QuickStartTileFooter);
