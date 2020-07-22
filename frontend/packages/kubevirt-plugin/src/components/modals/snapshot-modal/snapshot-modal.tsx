import * as React from 'react';
import { Alert, AlertVariant, Form, TextInput } from '@patternfly/react-core';
import { prefixedID } from '../../../utils';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { k8sCreate } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { FormRow } from '../../form/form-row';
import { ADD_SNAPSHOT, SAVE } from '../../../utils/strings';
import { ModalFooter } from '../modal/modal-footer';
import { VMSnapshotWrapper } from '../../../k8s/wrapper/vm/vm-snapshot-wrapper';

const getSnapshotName = (vmName: string) => {
  const date = new Date();
  return [vmName, date.getFullYear(), date.getUTCMonth() + 1, date.getDate()].join('-');
};

const SnapshotsModal = withHandlePromise((props: SnapshotsModalProps) => {
  const { vmLikeEntity, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const vmName = getName(vmLikeEntity);
  const [name, setName] = React.useState<string>(getSnapshotName(vmName));
  const asId = prefixedID.bind(null, 'snapshot');

  const submit = async (e) => {
    e.preventDefault();
    const snapshotWrapper = new VMSnapshotWrapper().init({
      name,
      namespace: getNamespace(vmLikeEntity),
      vmName,
    });

    handlePromise(k8sCreate(snapshotWrapper.getModel(), snapshotWrapper.asResource()))
      .then(close)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  };

  return (
    <div className="modal-content">
      <ModalTitle>{ADD_SNAPSHOT}</ModalTitle>
      <ModalBody>
        <Alert
          title="Snapshot only includes disks backed by a snapshot supported storage class"
          isInline
          variant={AlertVariant.info}
          className="co-m-form-row"
        />
        <Form onSubmit={submit}>
          <FormRow title="Snapshot Name" fieldId={asId('name')} isRequired>
            <TextInput
              autoFocus
              isRequired
              id={asId('name')}
              value={name}
              onChange={(v) => setName(v)}
            />
          </FormRow>
        </Form>
      </ModalBody>
      <ModalFooter
        id="snapshot"
        submitButtonText={SAVE}
        errorMessage={errorMessage}
        isDisabled={inProgress}
        inProgress={inProgress}
        onSubmit={submit}
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
      />
    </div>
  );
});

export default createModalLauncher(SnapshotsModal);

export type SnapshotsModalProps = {
  vmLikeEntity: VMLikeEntityKind;
} & ModalComponentProps &
  HandlePromiseProps;
