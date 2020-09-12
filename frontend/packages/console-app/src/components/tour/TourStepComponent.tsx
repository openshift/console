import * as React from 'react';
import { Popover, PopoverPlacement, Modal } from '@console/shared';
import { ModalVariant } from '@patternfly/react-core';
import StepHeader from './steps/StepHeader';
import StepFooter from './steps/StepFooter';
import StepBadge from './steps/StepBadge';
import StepContent from './steps/StepContent';
import { Spotlight } from './Spotlight';
import './TourStepComponent.scss';

type TourStepComponentProps = {
  selector?: string;
  placement?: string;
  heading: string;
  content: React.ReactNode;
  showClose?: boolean;
  step?: number;
  totalSteps?: number;
  showStepBadge?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  onNext?: () => void;
  onBack?: () => void;
  onClose?: () => void;
};

const TourStepComponent: React.FC<TourStepComponentProps> = ({
  placement,
  heading,
  content,
  selector,
  showStepBadge,
  showClose,
  step,
  totalSteps,
  nextButtonText,
  backButtonText,
  onNext,
  onBack,
  onClose,
}) => {
  const header = <StepHeader>{heading}</StepHeader>;
  const footer = (
    <StepFooter
      primaryButton={{
        name: nextButtonText,
        onClick: () => {
          onNext && onNext();
        },
      }}
      secondaryButton={{
        name: backButtonText,
        onClick: () => {
          onBack && onBack();
        },
      }}
    >
      {showStepBadge ? <StepBadge stepNumber={step} totalSteps={totalSteps} /> : null}
    </StepFooter>
  );
  const stepContent = <StepContent>{content}</StepContent>;
  const handleClose = () => {
    onClose && onClose();
  };
  return selector ? (
    <>
      <Spotlight selector={selector} />
      <Popover
        placement={placement as PopoverPlacement}
        headerContent={header}
        footerContent={footer}
        open
        onClose={handleClose}
        trigger={selector}
        uniqueId={step.toString()}
        id="guided-tour-popover"
      >
        {stepContent}
      </Popover>
    </>
  ) : (
    <Modal
      className="co-tour-step-component"
      variant={ModalVariant.small}
      showClose={showClose}
      isOpen
      header={header}
      footer={footer}
      onClose={handleClose}
      id="guided-tour-modal"
      data-test="guided-tour-modal"
      aria-label={`guided tour ${step}`}
      isFullScreen
    >
      {stepContent}
    </Modal>
  );
};

export default TourStepComponent;
