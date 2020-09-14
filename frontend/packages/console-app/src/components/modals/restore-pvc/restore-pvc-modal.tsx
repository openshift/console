import * as React from 'react';

import { Form, FormGroup, Grid, GridItem, TextInput } from '@patternfly/react-core';
import {
  HandlePromiseProps,
  ResourceIcon,
  withHandlePromise,
  validate,
  history,
  RequestSizeInput,
  Timestamp,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import {
  k8sCreate,
  VolumeSnapshotKind,
  StorageClassResourceKind,
  PersistentVolumeClaimKind,
  VolumeSnapshotClassKind,
} from '@console/internal/module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
} from '@console/internal/models';
import { getName, getNamespace, Status } from '@console/shared';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { dropdownUnits } from '@console/internal/components/storage/shared';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';

import './restore-pvc-modal.scss';

const RestorePVCModal = withHandlePromise<RestorePVCModalProps>(
  ({ close, cancel, resource, errorMessage, inProgress, handlePromise }) => {
    const [restorePVCName, setPVCName] = React.useState(`${getName(resource) || 'pvc'}-restore`);
    const defaultSize: string[] = resource?.status?.restoreSize
      ? validate.split(resource?.status?.restoreSize)
      : [null, null];
    const pvcRequestedSize = resource?.status?.restoreSize
      ? `${defaultSize[0]} ${dropdownUnits[defaultSize[1]]}`
      : '';
    const [requestedSize, setRequestedSize] = React.useState(defaultSize?.[0] ?? '');
    const [requestedUnit, setRequestedUnit] = React.useState(defaultSize?.[1] ?? 'Gi');
    const [pvcSC, setPVCStorageClass] = React.useState('');
    const namespace = getNamespace(resource);
    const snapshotName = getName(resource);

    const [pvcResource, pvcResourceLoaded, pvcResourceLoadError] = useK8sGet<
      PersistentVolumeClaimKind
    >(PersistentVolumeClaimModel, resource?.spec?.source?.persistentVolumeClaimName, namespace);

    const [
      snapshotClassResource,
      snapshotClassResourceLoaded,
      snapshotClassResourceLoadError,
    ] = useK8sGet<VolumeSnapshotClassKind>(
      VolumeSnapshotClassModel,
      resource?.spec?.volumeSnapshotClassName,
    );

    const onlyPvcSCs = (scObj: StorageClassResourceKind) =>
      !snapshotClassResourceLoadError
        ? scObj.provisioner.includes(snapshotClassResource?.driver)
        : true;

    const requestedSizeInputChange = ({ value, unit }) => {
      setRequestedSize(value);
      setRequestedUnit(unit);
    };

    const handleStorageClass = (updatedStorageClass) =>
      setPVCStorageClass(updatedStorageClass?.metadata.name || '');

    const submit = (event: React.FormEvent<EventTarget>) => {
      event.preventDefault();
      const accessModes =
        pvcResourceLoaded && !pvcResourceLoadError
          ? pvcResource?.spec.accessModes
          : ['ReadWriteOnce'];
      const restorePVCTemplate: PersistentVolumeClaimKind = {
        apiVersion: PersistentVolumeClaimModel.apiVersion,
        kind: PersistentVolumeClaimModel.kind,
        metadata: {
          name: restorePVCName,
          namespace,
        },
        spec: {
          storageClassName: pvcSC,
          dataSource: {
            name: snapshotName,
            kind: VolumeSnapshotModel.kind,
            apiGroup: VolumeSnapshotModel.apiGroup,
          },
          accessModes,
          resources: {
            requests: {
              storage: `${requestedSize}${requestedUnit}`,
            },
          },
        },
      };

      // eslint-disable-next-line promise/catch-or-return
      handlePromise(
        k8sCreate(PersistentVolumeClaimModel, restorePVCTemplate, namespace),
        (newPVC) => {
          close();
          history.push(
            resourcePathFromModel(PersistentVolumeClaimModel, newPVC.metadata.name, namespace),
          );
        },
      );
    };

    return (
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>Restore as new PVC</ModalTitle>
        <Form onSubmit={submit} name="form">
          <ModalBody>
            <p>
              When restore action for snapshot <strong>{snapshotName}</strong> is finished a new
              crash-consistent PVC copy will be created.
            </p>
            <FormGroup
              label="Name"
              isRequired
              fieldId="pvc-name"
              className="co-restore-pvc-modal__input"
            >
              <TextInput
                isRequired
                type="text"
                id="pvc-name"
                data-test="pvc-name"
                name="restore-pvc-modal__name"
                value={restorePVCName}
                onChange={setPVCName}
              />
            </FormGroup>
            <FormGroup
              fieldId="restore-storage-class"
              className="co-restore-pvc-modal__input"
              isRequired
            >
              {!snapshotClassResourceLoaded ? (
                <div className="skeleton-text" />
              ) : (
                <StorageClassDropdown
                  onChange={handleStorageClass}
                  filter={onlyPvcSCs}
                  id="restore-storage-class"
                  required
                />
              )}
            </FormGroup>
            <FormGroup
              label="Size"
              isRequired
              fieldId="pvc-size"
              className="co-restore-pvc-modal__input"
            >
              <RequestSizeInput
                name="requestSize"
                onChange={requestedSizeInputChange}
                defaultRequestSizeUnit={requestedUnit}
                defaultRequestSizeValue={requestedSize}
                dropdownUnits={dropdownUnits}
                required
              />
            </FormGroup>
            <div className="co-restore-pvc-modal__details-section">
              <p className="text-muted">{VolumeSnapshotModel.label} details</p>
              <Grid hasGutter>
                <GridItem span={6}>
                  <div className="co-restore-pvc-modal__pvc-details">
                    <strong>Created At</strong>
                    <span>
                      <Timestamp timestamp={resource?.metadata?.creationTimestamp} />
                    </span>
                  </div>
                  <div className="co-restore-pvc-modal__pvc-details">
                    <strong>Status</strong>
                    <Status status={resource?.status?.readyToUse ? 'Ready' : 'Not Ready'} />
                  </div>
                  <div className="co-restore-pvc-modal__pvc-details">
                    <strong>Size</strong>
                    <p>{pvcRequestedSize}</p>
                  </div>
                </GridItem>
                <GridItem span={6}>
                  <div className="co-restore-pvc-modal__pvc-details">
                    <strong>{NamespaceModel.label}</strong>
                    <div>
                      <ResourceIcon kind={NamespaceModel.kind} />
                      <span>{namespace}</span>
                    </div>
                  </div>
                  <div className="co-restore-pvc-modal__pvc-details">
                    <strong>API Version</strong>
                    <p>{resource?.apiVersion}</p>
                  </div>
                </GridItem>
              </Grid>
            </div>
          </ModalBody>
          <ModalSubmitFooter
            inProgress={inProgress}
            errorMessage={errorMessage}
            submitText="Restore"
            cancel={cancel}
          />
        </Form>
      </div>
    );
  },
);

type RestorePVCModalProps = {
  resource: VolumeSnapshotKind;
} & HandlePromiseProps &
  ModalComponentProps;

export default createModalLauncher(RestorePVCModal);
