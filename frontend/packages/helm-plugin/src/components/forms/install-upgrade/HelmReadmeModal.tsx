import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ModalComponentProps } from '@console/internal/components/factory';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

type HelmReadmeModalProps = {
  readme: string;
  theme?: string;
};
type Props = HelmReadmeModalProps & ModalComponentProps;

const HelmReadmeModal: FC<Props> = ({ readme, theme }) => {
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader title={t('helm-plugin~README')} labelId="helm-readme-modal-title" />
      <ModalBody>
        <SyncMarkdownView content={readme} theme={theme} />
      </ModalBody>
    </>
  );
};

const HelmReadmeModalProvider: OverlayComponent<Props> = (props) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.large}
      isOpen
      onClose={handleClose}
      aria-labelledby="helm-readme-modal-title"
    >
      <HelmReadmeModal {...props} />
    </Modal>
  ) : null;
};

export const useHelmReadmeModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(HelmReadmeModalProvider, props), [launcher, props]);
};
