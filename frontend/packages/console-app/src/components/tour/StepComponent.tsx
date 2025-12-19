import type { ReactNode, FC } from 'react';
import { useContext } from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { useTelemetry } from '@console/shared/src';
import { TourActions } from './const';
import { TourContext } from './tour-context';
import TourStepComponent from './TourStepComponent';
import { StepContentType } from './type';

type StepComponentProps = {
  heading: string;
  content: StepContentType;
  selector?: string;
  placement?: string;
  showStepBadge?: boolean;
  nextButtonText: string;
  backButtonText: string;
  expandableSelector?: string;
  introBannerLight?: ReactNode;
  introBannerDark?: ReactNode;
  modalVariant?: ModalVariant;
};

const StepComponent: FC<StepComponentProps> = ({
  heading,
  content,
  expandableSelector,
  selector,
  placement,
  nextButtonText,
  backButtonText,
  showStepBadge = true,
  introBannerLight,
  introBannerDark,
  modalVariant,
}) => {
  const fireTelemetryEvent = useTelemetry();
  const [activePerspective] = useActivePerspective();
  const { tourDispatch, totalSteps, tourState: { stepNumber: step } = {} } = useContext(
    TourContext,
  );
  return (
    <TourStepComponent
      key={step}
      step={step}
      introBannerLight={introBannerLight}
      introBannerDark={introBannerDark}
      content={content}
      heading={heading}
      modalVariant={modalVariant}
      selector={selector}
      expandableSelector={expandableSelector}
      placement={placement}
      totalSteps={totalSteps}
      showStepBadge={showStepBadge}
      nextButtonText={nextButtonText}
      backButtonText={backButtonText}
      onClose={() => {
        fireTelemetryEvent('guided-tour-close', {
          step,
          totalSteps,
          perspective: activePerspective,
        });
        tourDispatch?.({ type: TourActions.complete });
      }}
      onNext={() =>
        step && totalSteps && step > totalSteps
          ? tourDispatch?.({ type: TourActions.complete })
          : tourDispatch?.({ type: TourActions.next })
      }
      onBack={() => {
        if (step === 0) {
          fireTelemetryEvent('guided-tour-skip', {
            perspective: activePerspective,
          });
          tourDispatch?.({ type: TourActions.complete });
        } else {
          tourDispatch?.({ type: TourActions.back });
        }
      }}
    />
  );
};

export default StepComponent;
