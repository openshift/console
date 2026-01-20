import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { WarningModal, WarningModalProps } from '@patternfly/react-component-groups';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';

/**
 * ControlledWarningModal is a wrapper around WarningModal that manages its open state.
 */
const ControlledWarningModal: FC<WarningModalProps> = (props) => {
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
 * Supports two usage patterns:
 * - Pass props at hook initialization time: useWarningModal({ title: 'Title' })
 * - Pass props in the callback: const launch = useWarningModal(); launch({ title: 'Title' })
 * - Mix both (overrides have priority): const launch = useWarningModal({ title: 'Title' }); launch({ children: <Content /> })
 */
export const useWarningModal = (
  props?: Partial<ControlledWarningModalProps>,
): WarningModalCallbackWithProps => {
  const launcher = useOverlay();
  return useCallback(
    (overrides) => {
      const mergedProps: WarningModalProps = {
        children: null, // Default children
        ...(props || {}),
        ...(overrides || {}),
      };
      launcher<WarningModalProps>(ControlledWarningModal, mergedProps);
    },
    [launcher, props],
  );
};

/**
 * Props for the WarningModal component, excluding the isOpen prop which is managed internally.
 */
export type ControlledWarningModalProps = Omit<WarningModalProps, 'isOpen'>;

/**
 * Callback function type that accepts optional override props and launches a WarningModal.
 */
export type WarningModalCallbackWithProps = (overrides?: ControlledWarningModalProps) => void;
