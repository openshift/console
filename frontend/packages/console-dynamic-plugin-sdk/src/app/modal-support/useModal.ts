import { useContext } from 'react';
import type { LaunchModal } from './ModalProvider';
import { ModalContext } from './ModalProvider';

type UseModalLauncher = () => LaunchModal;

/**
 * @deprecated - Use useOverlay from \@console/dynamic-plugin-sdk instead.
 * A hook to launch Modals.
 *
 * Additional props can be passed to `useModal` and they will be passed through to the modal component.
 * An optional ID can also be passed to `useModal`. If provided, this distinguishes the modal from
 * other modals to allow multiple modals to be displayed at the same time.
 * @example
 *```tsx
 * const AppPage: React.FC = () => {
 *  const launchModal = useModal();
 *  const onClick1 = () => launchModal(ModalComponent);
 *  const onClick2 = () => launchModal(ModalComponent, { title: 'Test modal' }, 'TEST_MODAL_ID');
 *  return (
 *    <>
 *      <Button onClick={onClick1}>Launch basic modal</Button>
 *      <Button onClick={onClick2}>Launch modal with props and an ID</Button>
 *    </>
 *  )
 * }
 * ```
 */
export const useModal: UseModalLauncher = () => {
  const { launchModal } = useContext(ModalContext);
  return launchModal;
};
