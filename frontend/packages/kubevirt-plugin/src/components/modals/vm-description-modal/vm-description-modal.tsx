import * as React from 'react';
import { TextArea } from '@patternfly/react-core';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { k8sPatch } from '@console/internal/module/k8s';
import { getDescription } from '../../../selectors/selectors';
import { VMGenericLikeEntityKind } from '../../../types/vmLike';
import { getVMLikeModel } from '../../../selectors/vm';
import { getUpdateDescriptionPatches } from '../../../k8s/patches/vm/vm-patches';

// TODO: should be moved under kubevirt-plugin/src/style.scss
import './_vm-description-modal.scss';

export const VMDescriptionModal = withHandlePromise((props: VMDescriptionModalProps) => {
  const { vmLikeEntity, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const [description, setDescription] = React.useState(getDescription(vmLikeEntity));

  const submit = (e) => {
    e.preventDefault();

    const patches = getUpdateDescriptionPatches(vmLikeEntity, description);
    if (patches.length === 0) {
      close();
    } else {
      const promise = k8sPatch(getVMLikeModel(vmLikeEntity), vmLikeEntity, patches);
      handlePromise(promise, close);
    }
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>Edit Description</ModalTitle>
      <ModalBody>
        <TextArea
          className="kubevirt-vm-description-modal__description"
          value={description}
          onChange={(d) => setDescription(d)}
          aria-label="description text area"
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText="Save"
        cancel={cancel}
      />
    </form>
  );
});

export type VMDescriptionModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMGenericLikeEntityKind;
  };

export const vmDescriptionModal = createModalLauncher(VMDescriptionModal);
