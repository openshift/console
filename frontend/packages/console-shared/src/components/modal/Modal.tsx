import * as React from 'react';
import * as cx from 'classnames';
import { Modal as PfModal, ModalProps as PfModalProps } from '@patternfly/react-core';
import './Modal.scss';

type ModalProps = {
  isFullScreen?: boolean;
  ref?: React.LegacyRef<PfModal>;
} & PfModalProps;

const Modal: React.FC<ModalProps> = ({ isFullScreen = false, className, ...props }) => (
  <PfModal
    {...props}
    className={cx('ocs-modal', className)}
    appendTo={() => (isFullScreen ? document.body : document.querySelector('#modal-container'))}
  />
);

export default Modal;
