import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalComponentProps,
  ModalBody,
  ModalTitle,
} from '@console/internal/components/factory';
import NamespaceStoreForm from './namespace-store-form';
import '../noobaa-provider-endpoints/noobaa-provider-endpoints.scss';

const NamespaceStoreModal: React.FC<NamespaceStoreModalProps> = (props) => {
  const { t } = useTranslation();
  const { close } = props;

  return (
    <div className="nb-endpoints__modal">
      <ModalTitle>{t('ceph-storage-plugin~Create new NamespaceStore ')}</ModalTitle>
      <ModalBody>
        <p>
          {t(
            'ceph-storage-plugin~Represents an underlying storage to be used as read or write target for the data in the namespace buckets.',
          )}
        </p>
        <NamespaceStoreForm {...props} onCancel={() => close()} redirectHandler={() => close()} />
      </ModalBody>
    </div>
  );
};

type NamespaceStoreModalProps = ModalComponentProps & {
  namespace: string;
};

export default createModalLauncher(NamespaceStoreModal);
