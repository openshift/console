import type { ReactNode, FC } from 'react';
import { useContext } from 'react';
import {
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@console/internal/components/ThemeProvider';
import type { PopoverPlacement } from '@console/shared/src/components/popover/const';
import Popover from '@console/shared/src/components/popover/Popover';
import Spotlight from '@console/shared/src/components/spotlight/Spotlight';
import StepBadge from './steps/StepBadge';
import StepContent from './steps/StepContent';
import StepFooter from './steps/StepFooter';
import StepHeader from './steps/StepHeader';
import './TourStepComponent.scss';

type TourStepComponentProps = {
  expandableSelector?: string;
  selector?: string;
  placement?: string;
  heading: string;
  content: ReactNode;
  introBannerLight?: ReactNode;
  introBannerDark?: ReactNode;
  modalVariant?: ModalVariant;
  step?: number;
  totalSteps?: number;
  showStepBadge?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  onNext?: () => void;
  onBack?: () => void;
  onClose?: () => void;
};

const TourStepComponent: FC<TourStepComponentProps> = ({
  placement,
  heading,
  content,
  selector,
  expandableSelector,
  showStepBadge,
  step = 0,
  totalSteps = 0,
  introBannerLight,
  introBannerDark,
  modalVariant,
  nextButtonText,
  backButtonText,
  onNext,
  onBack,
  onClose,
}) => {
  const { t } = useTranslation();
  const theme = useContext(ThemeContext);
  const header = <StepHeader>{heading}</StepHeader>;
  const footer = (
    <StepFooter
      primaryButton={{
        name: nextButtonText || '',
        onClick: () => {
          onNext && onNext();
        },
      }}
      secondaryButton={{
        name: backButtonText || '',
        onClick: () => {
          onBack && onBack();
        },
      }}
      step={step}
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
      <Spotlight selector={selector} expandableSelector={expandableSelector} />
      <Popover
        placement={placement as PopoverPlacement}
        headerContent={header}
        footerContent={footer}
        open
        onClose={handleClose}
        trigger={selector}
        uniqueId={step?.toString() || ''}
        id="guided-tour-popover"
      >
        {stepContent}
      </Popover>
    </>
  ) : (
    <Modal
      className="co-tour-step-component"
      variant={modalVariant ?? ModalVariant.small}
      isOpen
      onClose={handleClose}
      id="guided-tour-modal"
      data-test="guided-tour-modal"
      aria-label={t('console-app~guided tour {{step, number}}', { step })}
    >
      <ModalBody>
        <Grid hasGutter>
          {(introBannerLight || introBannerDark) && (
            <GridItem span={4}>{theme === 'light' ? introBannerLight : introBannerDark}</GridItem>
          )}
          <GridItem span={introBannerLight || introBannerDark ? 8 : 12}>
            <ModalHeader>{header}</ModalHeader>
            <ModalBody>{stepContent}</ModalBody>
            <ModalFooter>{footer}</ModalFooter>
          </GridItem>
        </Grid>
      </ModalBody>
    </Modal>
  );
};

export default TourStepComponent;
