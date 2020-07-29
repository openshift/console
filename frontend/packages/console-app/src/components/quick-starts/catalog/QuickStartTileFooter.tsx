import * as React from 'react';
import { Dispatch, connect } from 'react-redux';
import { Flex, FlexItem, Button } from '@patternfly/react-core';
import * as QuickStartActions from '../../../redux/actions/quick-start-actions';
import { QuickStartStatus } from '../utils/quick-start-types';

type DispatchProps = {
  setQuickStartStatus?: (quickStartId: string, quickStartStatus: QuickStartStatus) => void;
};

type QuickStartTileFooterProps = {
  quickStartId: string;
  status: string;
  unmetPrerequisite?: boolean;
};

type Props = QuickStartTileFooterProps & DispatchProps;

const QuickStartTileFooter: React.FC<Props> = ({ quickStartId, status, setQuickStartStatus }) => (
  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
    {status === QuickStartStatus.NOT_STARTED && (
      <FlexItem>
        <Button
          onClick={() => setQuickStartStatus(quickStartId, QuickStartStatus.IN_PROGRESS)}
          variant="link"
          isInline
        >
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
        <Button
          onClick={() => setQuickStartStatus(quickStartId, QuickStartStatus.NOT_STARTED)}
          variant="link"
          isInline
        >
          Restart the tour
        </Button>
      </FlexItem>
    )}
  </Flex>
);

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setQuickStartStatus: (quickStartId: string, quickStartStatus: QuickStartStatus) =>
    dispatch(QuickStartActions.setQuickStartStatus(quickStartId, quickStartStatus)),
});

export const InternalQuickStartTileFooter = QuickStartTileFooter; // for testing

export default connect<{}, DispatchProps, QuickStartTileFooterProps>(
  null,
  mapDispatchToProps,
)(QuickStartTileFooter);
