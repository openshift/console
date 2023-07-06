import * as React from 'react';
import { LaunchModal, ModalContext } from './ModalProvider';

type UseModalLauncher = () => LaunchModal;

/**
 * A hook to launch Modals.
 * @example
 *```tsx
 * const AppPage: React.FC = () => {
 *  const launchModal = useModal();
 *  const onClick = () => launchModal(ModalComponent);
 *  return (
 *    <Button onClick={onClick}>Launch a Modal</Button>
 *  )
 * }
 * ```
 */
export const useModal: UseModalLauncher = () => {
  const { launchModal } = React.useContext(ModalContext);
  return launchModal;
};
