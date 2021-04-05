import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalComponentProps,
  ModalBody,
  ModalTitle,
} from '@console/internal/components/factory';
import CreateBackingStoreForm from './create-bs';
import '../noobaa-provider-endpoints/noobaa-provider-endpoints.scss';

const CreateBackingStoreFormModal: React.FC<CreateBackingStoreFormModal> = (props) => {
  const { t } = useTranslation();

  return (
    <div className="nb-endpoints__modal">
      <ModalTitle>{t('ceph-storage-plugin~Create new BackingStore ')}</ModalTitle>
      <ModalBody>
        <p>
          {t(
            'ceph-storage-plugin~BackingStore represents a storage target to be used as the underlying storage for the data in Multicloud Object Gateway buckets.',
          )}
        </p>
        <CreateBackingStoreForm {...props} />
      </ModalBody>
    </div>
  );
};

type CreateBackingStoreFormModal = ModalComponentProps & {
  namespace?: string;
};

export default createModalLauncher(CreateBackingStoreFormModal);
