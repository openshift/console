import { useContext } from 'react';
import type { LaunchOverlay } from './OverlayProvider';
import { OverlayContext } from './OverlayProvider';

type UseOverlayLauncher = () => LaunchOverlay;

/**
 * The `useOverlay` hook inserts a component directly to the DOM outside the web console's page structure. This allows the component to be freely styled and positioning with CSS. For example, to float the overlay in the top right corner of the UI: `style={{ position: 'absolute', right: '2rem', top: '2rem', zIndex: 999 }}`.
 *
 * It is possible to add multiple overlays by calling `useOverlay` multiple times.
 *
 * A `closeOverlay` function is passed to the overlay component. Calling it removes the component from the DOM without affecting any other overlays that might have been added with `useOverlay`.
 *
 * Additional props can be passed to `useOverlay` and they will be passed through to the overlay component.
 * @example
 *```tsx
 * const OverlayComponent = ({ closeOverlay, heading }) => {
 *   return (
 *     <div style={{ position: 'absolute', right: '2rem', top: '2rem', zIndex: 999 }}>
 *       <h2>{heading}</h2>
 *       <Button onClick={closeOverlay}>Close</Button>
 *     </div>
 *   );
 * };
 *
 * const ModalComponent = ({ body, closeOverlay, title }) => (
 *   <Modal isOpen onClose={closeOverlay}>
 *     <ModalHeader title={title} />
 *     <ModalBody>{body}</ModalBody>
 *   </Modal>
 * );
 *
 * const AppPage: React.FC = () => {
 *   const launchOverlay = useOverlay();
 *   const onClickOverlay = () => {
 *     launchOverlay(OverlayComponent, { heading: 'Test overlay' });
 *   };
 *   const onClickModal = () => {
 *     launchOverlay(ModalComponent, { body: 'Test modal', title: 'Overlay modal' });
 *   };
 *   return (
 *     <Button onClick={onClickOverlay}>Launch an Overlay</Button>
 *     <Button onClick={onClickModal}>Launch a Modal</Button>
 *   )
 * }
 * ```
 */
export const useOverlay: UseOverlayLauncher = () => {
  const { launchOverlay } = useContext(OverlayContext);
  return launchOverlay;
};
