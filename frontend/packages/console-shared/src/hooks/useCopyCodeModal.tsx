import * as React from 'react';
import { useModal } from '@console/dynamic-plugin-sdk/src/lib-core';
import { CopyToClipboard } from '@console/internal/components/utils';
import { Modal } from '@console/shared/src/components/modal';
import { ModalComponent } from 'packages/console-dynamic-plugin-sdk/src/app/modal-support/ModalProvider';

const CopyCodeModal: CopyCodeModalComponent = ({ title, snippet, closeModal }) => (
  <Modal isOpen onClose={closeModal} title={title} variant="medium">
    <CopyToClipboard key={snippet} value={snippet} />
  </Modal>
);

export const useCopyCodeModal: UseCopyCodeModal = (title, snippet) => {
  const launcher = useModal();
  return React.useCallback(() => (snippet ? launcher(CopyCodeModal, { title, snippet }) : null), [
    launcher,
    snippet,
    title,
  ]);
};

type CopyCodeModalProps = { title: string; snippet: string };
type CopyCodeModalComponent = ModalComponent<CopyCodeModalProps>;
type UseCopyCodeModal = (title: string, snippet: string) => () => void;
