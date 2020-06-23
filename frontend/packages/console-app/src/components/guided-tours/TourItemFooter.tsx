import * as React from 'react';
import { Flex, FlexItem, Button, FlexModifiers } from '@patternfly/react-core';
import { GuidedTourStatus } from './utils/guided-tour-status';

type TourItemFooterProps = {
  status: string;
  unmetPrerequisite?: boolean;
};
const TourItemFooter: React.FC<TourItemFooterProps> = ({ status, unmetPrerequisite = false }) => (
  <Flex breakpointMods={[{ modifier: FlexModifiers['justify-content-space-between'] }]}>
    {status === GuidedTourStatus.NOT_STARTED && (
      <FlexItem>
        <Button variant="link" isInline isDisabled={unmetPrerequisite}>
          Start the tour
        </Button>
      </FlexItem>
    )}
    {status === GuidedTourStatus.IN_PROGRESS && (
      <FlexItem>
        <Button variant="link" isInline>
          Resume the tour
        </Button>
      </FlexItem>
    )}
    {status === GuidedTourStatus.COMPLETE && (
      <FlexItem>
        <Button variant="link" isInline>
          Review the tour
        </Button>
      </FlexItem>
    )}
    {status === GuidedTourStatus.IN_PROGRESS && (
      <FlexItem>
        <Button variant="link" isInline>
          Restart the tour
        </Button>
      </FlexItem>
    )}
  </Flex>
);
export default TourItemFooter;
