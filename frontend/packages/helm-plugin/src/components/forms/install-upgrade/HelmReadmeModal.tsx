import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import {
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalWrapper,
} from '@console/internal/components/factory';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

type HelmReadmeModalProps = {
  readme: string;
  theme?: string;
};
type Props = HelmReadmeModalProps & ModalComponentProps;

const HelmReadmeModal: FunctionComponent<Props> = ({ readme, theme, close }) => {
  const { t } = useTranslation();
  return (
    <div className="modal-content">
      <ModalTitle close={close}>{t('helm-plugin~README')}</ModalTitle>
      <ModalBody>
        <SyncMarkdownView content={readme} theme={theme} />
      </ModalBody>
    </div>
  );
};

const HelmReadmeModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay} className="modal-lg">
      <HelmReadmeModal close={props.closeOverlay} cancel={props.closeOverlay} {...props} />
    </ModalWrapper>
  );
};

export const useHelmReadmeModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(HelmReadmeModalProvider, props), [launcher, props]);
};
