import * as React from 'react';

import {
  Dropdown,
  Firehose,
  FirehoseResourcesResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import { K8sResourceKind, K8sResourceKindReference, k8sCreate } from '@console/internal/module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory';
import { getName, getNamespace } from '@console/shared';

import { PersistentVolumeClaimModel } from '@console/internal/models';
import { VolumeSnapshotModel } from '../../../models';

export type VolumeSnapshotModalProps = {
  pvcData?: FirehoseResourcesResult;
} & HandlePromiseProps &
  ModalComponentProps;

export const VolumeSnapshotModal = withHandlePromise((props: VolumeSnapshotModalProps) => {
  const { close, cancel, pvcData, errorMessage, inProgress, handlePromise } = props;
  const resource = pvcData.data as K8sResourceKind;
  const [snapshotName, setSnapshotName] = React.useState(
    `${getName(resource) || 'pvc'}-snapshot-1`,
  );
  const snapshotTypes = {
    single: 'Single Snapshot',
  };

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
          name: pvcName,
          kind: PersistentVolumeClaimModel.kind,
        },
      },
    };
    handlePromise(k8sCreate(VolumeSnapshotModel, snapshotTemplate))
      .then(close)
      .catch((error) => {
        throw error;
      });
  };

  return (
    <Form onSubmit={submit}>
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>Create Snapshot</ModalTitle>
        <ModalBody>
          <p>Creating snapshot for {getName(resource)}</p>
          <FormGroup label="Name" isRequired fieldId="snapshot-name">
            <TextInput
              isRequired
              type="text"
              name="snapshot-name"
              aria-label="snapshot-name"
              value={snapshotName}
              onChange={setSnapshotName}
            />
          </FormGroup>
          <FormGroup label="Schedule" fieldId="snapshot-modal__schedule">
            <Dropdown
              dropDownClassName="dropdown--full-width"
              items={snapshotTypes}
              selectedKey={snapshotTypes.single}
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
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  pvcData?: FirehoseResourcesResult;
  resource?: K8sResourceKind;
} & ModalComponentProps;

const VolumeSnapshotModalWithFireHose: React.FC<VolumeSnapshotModalWithFireHoseProps> = (props) => (
  <Firehose
    resources={[
      {
        kind: props.kind || PersistentVolumeClaimModel.kind,
        prop: 'pvcData',
        namespace: props?.resource?.metadata?.namespace || props.namespace,
        isList: false,
        name: props?.resource?.metadata?.name || props.name,
      },
    ]}
  >
    <VolumeSnapshotModal {...props} />
  </Firehose>
);

export const volumeSnapshotModal = createModalLauncher(VolumeSnapshotModalWithFireHose);
