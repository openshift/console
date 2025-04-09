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
  <Flex alignItems={{ default: 'alignItemsCenter' }}>
    {children && <FlexItem>{children}</FlexItem>}
    {children && <FlexItem grow={{ default: 'grow' }} />}
    <FlexItem>
      <Flex spaceItems={{ default: 'spaceItemsMd' }}>
        <FlexItem>
          <Button
            variant="secondary"
            id="tour-step-footer-secondary"
            data-test="tour-step-footer-secondary"
            onClick={secondaryButtonCallback}
          >
            {secondaryButton}
          </Button>
        </FlexItem>
        <FlexItem>
          <Button
            variant="primary"
            id="tour-step-footer-primary"
            data-test="tour-step-footer-primary"
            onClick={primaryButtonCallback}
          >
            {primaryButton}
          </Button>
        </FlexItem>
      </Flex>
    </FlexItem>
  </Flex>
);

export default StepFooter;
