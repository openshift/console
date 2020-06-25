import * as React from 'react';
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

const HelmReadmeModal: React.FunctionComponent<Props> = ({ readme, close }) => (
  <div className="modal-content">
    <ModalTitle close={close}>README</ModalTitle>
    <ModalBody>
      <SyncMarkdownView content={readme} />
    </ModalBody>
  </div>
);

export const helmReadmeModalLauncher = createModalLauncher<Props>(HelmReadmeModal);
export default HelmReadmeModal;
