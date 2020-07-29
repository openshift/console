import * as React from 'react';
import { Flex, FlexItem, Button } from '@patternfly/react-core';

type StepFooterProps = {
  primaryButton: {
    name: string;
    onClick: () => void;
  };
  secondaryButton: {
    name: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
};

const StepFooter: React.FC<StepFooterProps> = ({
  children,
  primaryButton: { name: primaryButton, onClick: primaryButtonCallback },
  secondaryButton: { name: secondaryButton, onClick: secondaryButtonCallback },
}) => (
  <Flex>
    {children && <FlexItem>{children}</FlexItem>}
    <FlexItem align={{ default: 'alignRight' }}>
      <Button variant="secondary" id="tour-step-footer-secondary" onClick={secondaryButtonCallback}>
        {secondaryButton}
      </Button>
    </FlexItem>
    <FlexItem>
      <Button variant="primary" id="tour-step-footer-primary" onClick={primaryButtonCallback}>
        {primaryButton}
      </Button>
    </FlexItem>
  </Flex>
);

export default StepFooter;
