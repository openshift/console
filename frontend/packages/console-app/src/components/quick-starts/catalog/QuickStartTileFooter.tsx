import * as React from 'react';
import { Dispatch, connect } from 'react-redux';
import { Flex, FlexItem, Button } from '@patternfly/react-core';
import * as QuickStartActions from '../../../redux/actions/quick-start-actions';
import { QuickStartStatus } from '../utils/quick-start-types';

type DispatchProps = {
  setQuickStartStatus?: (quickStartId: string, quickStartStatus: QuickStartStatus) => void;
  setQuickStartTaskNumber?: (quickStartId: string, taskNumber: number) => void;
};

type QuickStartTileFooterProps = {
  quickStartId: string;
  status: string;
  unmetPrerequisite?: boolean;
};

type Props = QuickStartTileFooterProps & DispatchProps;

const QuickStartTileFooter: React.FC<Props> = ({
  quickStartId,
  status,
  setQuickStartStatus,
  setQuickStartTaskNumber,
}) => {
  const startQuickStart = React.useCallback(
    () => setQuickStartStatus(quickStartId, QuickStartStatus.IN_PROGRESS),
    [quickStartId, setQuickStartStatus],
  );

  const restartQuickStart = React.useCallback(() => {
    startQuickStart();
    setQuickStartTaskNumber(quickStartId, 0);
  }, [quickStartId, setQuickStartTaskNumber, startQuickStart]);

  return (
    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
      {status === QuickStartStatus.NOT_STARTED && (
        <FlexItem>
          <Button onClick={startQuickStart} variant="link" isInline>
            Start the tour
          </Button>
        </FlexItem>
      )}
      {status === QuickStartStatus.IN_PROGRESS && (
        <FlexItem>
          <Button variant="link" isInline>
            Resume the tour
          </Button>
        </FlexItem>
      )}
      {status === QuickStartStatus.COMPLETE && (
        <FlexItem>
          <Button variant="link" isInline>
            Review the tour
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

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setQuickStartStatus: (quickStartId: string, quickStartStatus: QuickStartStatus) =>
    dispatch(QuickStartActions.setQuickStartStatus(quickStartId, quickStartStatus)),
  setQuickStartTaskNumber: (quickStartId: string, taskNumber: number) =>
    dispatch(QuickStartActions.setQuickStartTaskNumber(quickStartId, taskNumber)),
});

export const InternalQuickStartTileFooter = QuickStartTileFooter; // for testing

export default connect<{}, DispatchProps, QuickStartTileFooterProps>(
  null,
  mapDispatchToProps,
)(QuickStartTileFooter);
