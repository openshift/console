import type { LegacyRef, FC } from 'react';
import { Modal as PfModal, ModalProps as PfModalProps } from '@patternfly/react-core/deprecated';
import { css } from '@patternfly/react-styles';
import './Modal.scss';

type ModalProps = {
  isFullScreen?: boolean;
  ref?: LegacyRef<PfModal>;
} & PfModalProps;

const Modal: FC<ModalProps> = ({ isFullScreen = false, className, ...props }) => (
  <PfModal
    {...props}
    className={css('ocs-modal', className)}
    appendTo={() => (isFullScreen ? document.body : document.querySelector('#modal-container'))}
  />
);

export default Modal;
