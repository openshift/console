import { useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, ModalVariant } from '@patternfly/react-core';
import { useModal } from '@console/dynamic-plugin-sdk/src/lib-core';
import { CopyToClipboard } from '@console/internal/components/utils/copy-to-clipboard';
import type { ModalComponent } from 'packages/console-dynamic-plugin-sdk/src/app/modal-support/ModalProvider';

const CopyCodeModal: CopyCodeModalComponent = ({ title, snippet, closeModal }) => (
  <Modal isOpen onClose={closeModal} variant={ModalVariant.medium}>
    <ModalHeader title={title} />
    <ModalBody>
      <CopyToClipboard key={snippet} value={snippet} />
    </ModalBody>
  </Modal>
);

export const useCopyCodeModal: UseCopyCodeModal = (title, snippet) => {
  const launcher = useModal();
  return useCallback(() => (snippet ? launcher(CopyCodeModal, { title, snippet }) : null), [
    launcher,
    snippet,
    title,
  ]);
};

type CopyCodeModalProps = { title: string; snippet: string };
type CopyCodeModalComponent = ModalComponent<CopyCodeModalProps>;
type UseCopyCodeModal = (title: string, snippet: string) => () => void;
