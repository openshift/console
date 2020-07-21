import * as React from 'react';
import { Flex, FlexItem, Button } from '@patternfly/react-core';
import { QuickStartStatus } from './utils/quick-start-status';

type QuickStartFooterProps = {
  status: string;
  unmetPrerequisite?: boolean;
};
const QuickStartFooter: React.FC<QuickStartFooterProps> = ({
  status,
  unmetPrerequisite = false,
}) => (
  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
    {status === QuickStartStatus.NOT_STARTED && (
      <FlexItem>
        <Button variant="link" isInline isDisabled={unmetPrerequisite}>
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
        <Button variant="link" isInline>
          Restart the tour
        </Button>
      </FlexItem>
    )}
  </Flex>
);
export default QuickStartFooter;
