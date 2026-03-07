import { useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, ModalVariant } from '@patternfly/react-core';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { CopyToClipboard } from '@console/internal/components/utils/copy-to-clipboard';

const CopyCodeModal: CopyCodeModalComponent = ({ title, snippet, closeOverlay }) => (
  <Modal isOpen onClose={closeOverlay} variant={ModalVariant.medium}>
    <ModalHeader title={title} />
    <ModalBody>
      <CopyToClipboard key={snippet} value={snippet} />
    </ModalBody>
  </Modal>
);

export const useCopyCodeModal: UseCopyCodeModal = (title, snippet) => {
  const launchModal = useOverlay();
  return useCallback(() => (snippet ? launchModal(CopyCodeModal, { title, snippet }) : null), [
    launchModal,
    snippet,
    title,
  ]);
};

type CopyCodeModalProps = { title: string; snippet: string };
type CopyCodeModalComponent = OverlayComponent<CopyCodeModalProps>;
type UseCopyCodeModal = (title: string, snippet: string) => () => void;
