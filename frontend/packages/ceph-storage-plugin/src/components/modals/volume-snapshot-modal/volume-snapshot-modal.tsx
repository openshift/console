import * as React from 'react';

import {
  Dropdown,
  Firehose,
  FirehoseResourcesResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import { getName, getNamespace } from '@console/shared';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { VolumeSnapshotModel } from '../../../models';

import './_volume-snapshot-modal.scss';

export type VolumeSnapshotModalProps = {
  pvcData?: FirehoseResourcesResult;
} & HandlePromiseProps &
  ModalComponentProps;

export const snapshotTypes = {
  Single: 'Single',
};

export const VolumeSnapshotModal = withHandlePromise((props: VolumeSnapshotModalProps) => {
  const { close, cancel, pvcData, errorMessage, inProgress, handlePromise } = props;
  const resource = pvcData.data as K8sResourceKind;
  const [snapshotName, setSnapshotName] = React.useState<string>(
    `${getName(resource) || 'pvc'}-snapshot`,
  );
  const [scheduleType, setScheduleType] = React.useState(snapshotTypes.Single);

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    const ns = getNamespace(resource);
    const pvcName = getName(resource);
    const snapshotTemplate: K8sResourceKind = {
      apiVersion: VolumeSnapshotModel.apiVersion,
      kind: VolumeSnapshotModel.kind,
      metadata: {
        name: snapshotName,
        namespace: ns,
      },
      spec: {
        source: {
          persistentVolumeClaimName: pvcName,
        },
      },
    };
    handlePromise(k8sCreate(VolumeSnapshotModel, snapshotTemplate), close);
  };

  return (
    <Form onSubmit={submit} name="form">
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>Create Snapshot</ModalTitle>
        <ModalBody>
          <p>Creating snapshot for {getName(resource)}</p>
          <FormGroup
            className="ceph-volume-snapshot-modal__input"
            label="Name"
            isRequired
            fieldId="snapshot-name"
          >
            <TextInput
              type="text"
              name="snapshot-name"
              value={snapshotName}
              onChange={setSnapshotName}
              aria-labelledby="snapshot-name"
            />
          </FormGroup>
          <FormGroup
            className="ceph-volume-snapshot-modal__input"
            label="Schedule"
            fieldId="snapshot-type"
          >
            <Dropdown
              dropDownClassName="dropdown--full-width"
              items={snapshotTypes}
              selectedKey={scheduleType}
              onChange={(value) => setScheduleType(snapshotTypes[value])}
            />
          </FormGroup>
        </ModalBody>
        <ModalSubmitFooter
          inProgress={inProgress}
          errorMessage={errorMessage}
          submitText="Create"
          cancel={cancel}
        />
      </div>
    </Form>
  );
});

type VolumeSnapshotModalWithFireHoseProps = {
  resource: K8sResourceKind;
} & ModalComponentProps;

export const VolumeSnapshotModalWithFireHose: React.FC<VolumeSnapshotModalWithFireHoseProps> = ({
  resource,
  ...rest
}) => (
  <Firehose
    resources={[
      {
        kind: resource?.kind || PersistentVolumeClaimModel.kind,
        prop: 'pvcData',
        namespace: resource?.metadata?.namespace,
        isList: false,
        name: resource?.metadata?.name,
      },
    ]}
  >
    <VolumeSnapshotModal {...rest} />
  </Firehose>
);

export const volumeSnapshotModal = createModalLauncher(VolumeSnapshotModalWithFireHose);
