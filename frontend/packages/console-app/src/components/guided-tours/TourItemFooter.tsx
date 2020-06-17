import * as React from 'react';
import { Flex, FlexItem, Button, FlexModifiers } from '@patternfly/react-core';
import { GuidedTourStatus } from './utils/guided-tour-status';

type TourItemFooterProps = {
  status: string;
};
const TourItemFooter: React.FC<TourItemFooterProps> = ({ status }) => (
  <div className="odc-guided-tour__footer">
    <Flex breakpointMods={[{ modifier: FlexModifiers['justify-content-space-between'] }]}>
      {status === GuidedTourStatus.NOT_STARTED && (
        <FlexItem>
          <Button variant="link" isInline>
            Start the Tour
          </Button>
        </FlexItem>
      )}
      {status === GuidedTourStatus.IN_PROGRESS && (
        <FlexItem>
          <Button variant="link" isInline>
            Resume the Tour
          </Button>
        </FlexItem>
      )}
      {status === GuidedTourStatus.COMPLETE && (
        <FlexItem>
          <Button variant="link" isInline>
            Review the Tour
          </Button>
        </FlexItem>
      )}
      {(status === GuidedTourStatus.COMPLETE || status === GuidedTourStatus.IN_PROGRESS) && (
        <FlexItem>
          <Button variant="link" isInline>
            Restart the Tour
          </Button>
        </FlexItem>
      )}
    </Flex>
  </div>
);
export default TourItemFooter;
