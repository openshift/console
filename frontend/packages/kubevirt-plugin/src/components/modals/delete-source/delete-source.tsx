import * as React from 'react';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { k8sKill } from '@console/internal/module/k8s';
import { DataVolumeModel } from '../../../models';
import { TemplateSourceStatusBundle } from '../../../statuses/template/types';

type DeleteSourceModalProps = ModalComponentProps & {
  sourceStatus: TemplateSourceStatusBundle;
};

const DeleteSourceModal: React.FC<DeleteSourceModalProps> = ({ sourceStatus, cancel, close }) => {
  const ref = React.useRef(null);
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState<string>();
  // hack to close template source popup
  // programatically controlled popup is not responsive enough https://github.com/patternfly/patternfly-react/issues/4515
  React.useEffect(() => ref.current?.click(), []);
  const { dataVolume, pvc } = sourceStatus;
  const submit = async () => {
    try {
      setInProgress(true);
      if (dataVolume) {
        await k8sKill(DataVolumeModel, dataVolume);
      } else if (pvc) {
        await k8sKill(PersistentVolumeClaimModel, pvc);
      }
      setInProgress(false);
      close();
    } catch (err) {
      setInProgress(false);
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit} className="modal-content" ref={ref}>
      <ModalTitle>Delete source</ModalTitle>
      <ModalBody>
        Deleting {dataVolume?.metadata?.name || pvc?.metadata?.name} from this template will remove
        it from template for all users.
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={error}
        inProgress={inProgress}
        submitDanger
        submitText="Delete source"
        cancel={cancel}
      />
    </form>
  );
};

export const createDeleteSourceModal = createModalLauncher(DeleteSourceModal);
