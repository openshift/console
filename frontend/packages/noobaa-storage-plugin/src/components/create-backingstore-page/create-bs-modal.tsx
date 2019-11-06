import * as React from 'react';
import {
  createModalLauncher,
  ModalComponentProps,
  ModalBody,
  ModalTitle,
} from '@console/internal/components/factory';
import CreateBackingStoreForm from './create-bs';
import './create-bs.scss';

const CreateBackingStoreFormModal: React.FC<ModalComponentProps> = (props) => {
  return (
    <div className="nb-create-bs__modal">
      <ModalTitle>Create new BackingStore</ModalTitle>
      <ModalBody>
        <p>
          BackingStore represents a storage target to be used as the underlying storage for the data
          in MCG buckets.
        </p>
        <CreateBackingStoreForm {...props} />
      </ModalBody>
    </div>
  );
};

export default createModalLauncher(CreateBackingStoreFormModal);
