import type { ReactNode, FC } from 'react';
import { Flex, FlexItem, Button, ButtonVariant } from '@patternfly/react-core';

type StepFooterProps = {
  primaryButton: {
    name: string;
    onClick: () => void;
  };
  secondaryButton: {
    name: string;
    onClick: () => void;
  };
  children?: ReactNode;
  step?: number;
};

const IntroductionModalFooter = ({
  primaryButton,
  secondaryButton,
  primaryButtonCallback,
  secondaryButtonCallback,
}) => {
  return (
    <FlexItem>
      <Flex spaceItems={{ default: 'spaceItemsMd' }}>
        <FlexItem>
          <Button
            variant={ButtonVariant.primary}
            id="tour-step-footer-primary"
            data-test="tour-step-footer-primary"
            onClick={primaryButtonCallback}
          >
            {primaryButton}
          </Button>
        </FlexItem>
        <FlexItem>
          <Button
            variant={ButtonVariant.link}
            id="tour-step-footer-secondary"
            data-test="tour-step-footer-secondary"
            onClick={secondaryButtonCallback}
          >
            {secondaryButton}
          </Button>
        </FlexItem>
      </Flex>
    </FlexItem>
  );
};

const PopoverFooter = ({
  primaryButton,
  secondaryButton,
  primaryButtonCallback,
  secondaryButtonCallback,
}) => {
  return (
    <FlexItem>
      <Flex spaceItems={{ default: 'spaceItemsMd' }}>
        <FlexItem>
          <Button
            variant={ButtonVariant.secondary}
            id="tour-step-footer-secondary"
            data-test="tour-step-footer-secondary"
            onClick={secondaryButtonCallback}
          >
            {secondaryButton}
          </Button>
        </FlexItem>
        <FlexItem>
          <Button
            variant={ButtonVariant.primary}
            id="tour-step-footer-primary"
            data-test="tour-step-footer-primary"
            onClick={primaryButtonCallback}
          >
            {primaryButton}
          </Button>
        </FlexItem>
      </Flex>
    </FlexItem>
  );
};

const StepFooter: FC<StepFooterProps> = ({
  children,
  primaryButton: { name: primaryButton, onClick: primaryButtonCallback },
  secondaryButton: { name: secondaryButton, onClick: secondaryButtonCallback },
  step,
}) => (
  <Flex alignItems={{ default: 'alignItemsCenter' }}>
    {children && <FlexItem>{children}</FlexItem>}
    {children && <FlexItem grow={{ default: 'grow' }} />}
    {step === 0 ? (
      <IntroductionModalFooter
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        primaryButtonCallback={primaryButtonCallback}
        secondaryButtonCallback={secondaryButtonCallback}
      />
    ) : (
      <PopoverFooter
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        primaryButtonCallback={primaryButtonCallback}
        secondaryButtonCallback={secondaryButtonCallback}
      />
    )}
  </Flex>
);

export default StepFooter;
