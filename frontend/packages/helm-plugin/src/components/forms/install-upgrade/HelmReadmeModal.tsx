import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ModalTitle,
  ModalBody,
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

type HelmReadmeModalProps = {
  readme: string;
};
type Props = HelmReadmeModalProps & ModalComponentProps;

const HelmReadmeModal: React.FunctionComponent<Props> = ({ readme, close }) => {
  const { t } = useTranslation();
  return (
    <div className="modal-content">
      <ModalTitle close={close}>{t('helm-plugin~README')}</ModalTitle>
      <ModalBody>
        <SyncMarkdownView content={readme} />
      </ModalBody>
    </div>
  );
};

export const helmReadmeModalLauncher = createModalLauncher<Props>(HelmReadmeModal);
export default HelmReadmeModal;
