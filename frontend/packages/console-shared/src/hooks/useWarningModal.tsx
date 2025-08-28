import { useState, useCallback } from 'react';
import { WarningModal, WarningModalProps } from '@patternfly/react-component-groups';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalCallback } from '@console/internal/components/modals/types';

/**
 * ControlledWarningModal is a wrapper around WarningModal that manages its open state.
 */
const ControlledWarningModal: React.FCC<WarningModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);

  const onClose: WarningModalProps['onClose'] = (e) => {
    setIsOpen(false);
    props.onClose?.(e);
  };

  const onConfirm: WarningModalProps['onConfirm'] = () => {
    setIsOpen(false);
    props.onConfirm?.();
  };

  return <WarningModal {...props} isOpen={isOpen} onClose={onClose} onConfirm={onConfirm} />;
};

/**
 * useWarningModal is a hook that provides a way to launch a WarningModal.
 */
export const useWarningModal = (props: Omit<WarningModalProps, 'isOpen'>): ModalCallback => {
  const launcher = useOverlay();
  return useCallback(() => {
    launcher<WarningModalProps>(ControlledWarningModal, props);
  }, [launcher, props]);
};

/**
 * useWarningModalWithProps returns a WarningModal launcher that accepts override props
 */
export type WarningModalCallbackWithProps = (overrides: Omit<WarningModalProps, 'isOpen'>) => void;

export const useWarningModalWithProps = (
  props?: Partial<Omit<WarningModalProps, 'isOpen'>>,
): WarningModalCallbackWithProps => {
  const launcher = useOverlay();
  return (overrides) => {
    launcher<WarningModalProps>(ControlledWarningModal, { ...(props || {}), ...overrides });
  };
};
