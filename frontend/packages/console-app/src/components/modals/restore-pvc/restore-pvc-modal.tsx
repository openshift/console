import * as React from 'react';
import { FormGroup, Grid, GridItem, TextInput } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { VolumeModeSelector } from '@console/app/src/components/volume-modes/volume-mode';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory';
import {
  dropdownUnits,
  snapshotPVCStorageClassAnnotation,
  snapshotPVCAccessModeAnnotation,
  snapshotPVCVolumeModeAnnotation,
} from '@console/internal/components/storage/shared';
import {
  HandlePromiseProps,
  ResourceIcon,
  withHandlePromise,
  validate,
  history,
  RequestSizeInput,
  Timestamp,
  resourcePathFromModel,
  convertToBaseValue,
} from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
} from '@console/internal/models';
import {
  k8sCreate,
  VolumeSnapshotKind,
  StorageClassResourceKind,
  PersistentVolumeClaimKind,
  VolumeSnapshotClassKind,
} from '@console/internal/module/k8s';
import { getName, getNamespace, Status, isCephProvisioner, getAnnotations } from '@console/shared';
import { AccessModeSelector } from '../../access-modes/access-mode';

import './restore-pvc-modal.scss';

const RestorePVCModal = withHandlePromise<RestorePVCModalProps>(
  ({ close, cancel, resource, errorMessage, inProgress, handlePromise }) => {
    const { t } = useTranslation();
    const [restorePVCName, setPVCName] = React.useState(`${getName(resource) || 'pvc'}-restore`);
    const volumeSnapshotAnnotations = getAnnotations(resource);
    const defaultSize: string[] = resource?.status?.restoreSize
      ? validate.split(resource?.status?.restoreSize)
      : [null, null];
    const pvcRequestedSize = resource?.status?.restoreSize
      ? `${defaultSize[0]} ${dropdownUnits[defaultSize[1]]}`
      : '';
    const [requestedSize, setRequestedSize] = React.useState(defaultSize?.[0] ?? '');
    const [requestedUnit, setRequestedUnit] = React.useState(defaultSize?.[1] ?? 'Ti');
    const [pvcSC, setPVCStorageClass] = React.useState('');
    const [validSize, setValidSize] = React.useState(true);
    const [restoreAccessMode, setRestoreAccessMode] = React.useState('');
    const [updatedProvisioner, setUpdatedProvisioner] = React.useState('');
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

    const [volumeMode, setVolumeMode] = React.useState('');
    const onlyPvcSCs = (scObj: StorageClassResourceKind) =>
      !snapshotClassResourceLoadError
        ? scObj.provisioner.includes(snapshotClassResource?.driver)
        : true;

    const requestedSizeInputChange = ({ value, unit }) => {
      setRequestedSize(value);
      setRequestedUnit(unit);
      const restoreSizeInBytes = convertToBaseValue(value + unit);
      const snapshotSizeInBytes = convertToBaseValue(resource?.status?.restoreSize);
      const isValid = restoreSizeInBytes >= snapshotSizeInBytes;
      setValidSize(isValid);
    };

    const handleStorageClass = (updatedStorageClass: StorageClassResourceKind) => {
      setPVCStorageClass(updatedStorageClass?.metadata.name || '');
      setUpdatedProvisioner(updatedStorageClass?.provisioner);
    };

    const submit = (event: React.FormEvent<EventTarget>) => {
      event.preventDefault();
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
          accessModes: [restoreAccessMode],
          volumeMode,
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
      <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>{t('console-app~Restore as new PVC')}</ModalTitle>
        <ModalBody>
          <p>
            <Trans t={t} ns="console-app">
              When restore action for snapshot <strong>{{ snapshotName }}</strong> is finished a new
              crash-consistent PVC copy will be created.
            </Trans>
          </p>
          <FormGroup
            label={t('console-app~Name')}
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
          <FormGroup fieldId="restore-storage-class" className="co-restore-pvc-modal__input">
            {!snapshotClassResourceLoaded ? (
              <div className="skeleton-text" />
            ) : (
              <StorageClassDropdown
                onChange={handleStorageClass}
                filter={onlyPvcSCs}
                id="restore-storage-class"
                required
                selectedKey={volumeSnapshotAnnotations?.[snapshotPVCStorageClassAnnotation]}
              />
            )}
          </FormGroup>
          <AccessModeSelector
            onChange={setRestoreAccessMode}
            className="co-restore-pvc-modal__input"
            provisioner={updatedProvisioner}
            loaded={pvcResourceLoaded}
            loadError={pvcResourceLoadError}
            pvcResource={pvcResource}
            availableAccessModes={volumeSnapshotAnnotations?.[
              snapshotPVCAccessModeAnnotation
            ]?.split(',')}
          />
          <VolumeModeSelector
            onChange={setVolumeMode}
            className="co-restore-pvc-modal__input"
            provisioner={updatedProvisioner}
            pvcResource={pvcResource}
            accessMode={restoreAccessMode}
            storageClass={pvcSC}
            loaded={pvcResourceLoaded}
            availableVolumeMode={volumeSnapshotAnnotations?.[snapshotPVCVolumeModeAnnotation]}
          />
          <FormGroup
            label={t('console-app~Size')}
            isRequired
            fieldId="pvc-size"
            className="co-restore-pvc-modal__input co-restore-pvc-modal__ocs-size"
            helperTextInvalid={t(
              'console-app~Size should be equal or greater than the restore size of snapshot',
            )}
            validated={validSize ? 'default' : 'error'}
          >
            {snapshotClassResourceLoaded ? (
              <RequestSizeInput
                name="requestSize"
                onChange={requestedSizeInputChange}
                defaultRequestSizeUnit={requestedUnit}
                defaultRequestSizeValue={requestedSize}
                dropdownUnits={dropdownUnits}
                isInputDisabled={
                  snapshotClassResourceLoadError || isCephProvisioner(snapshotClassResource?.driver)
                }
                required
              />
            ) : (
              <div className="skeleton-text" />
            )}
          </FormGroup>
          <div className="co-restore-pvc-modal__details-section">
            <p className="text-muted">
              {t('console-app~{{resourceKind}} details', {
                resourceKind: VolumeSnapshotModel.label,
              })}
            </p>
            <Grid hasGutter>
              <GridItem span={6}>
                <div className="co-restore-pvc-modal__pvc-details">
                  <strong>{t('console-app~Created at')}</strong>
                  <span>
                    <Timestamp timestamp={resource?.metadata?.creationTimestamp} />
                  </span>
                </div>
                <div className="co-restore-pvc-modal__pvc-details">
                  <strong>{t('console-app~Status')}</strong>
                  <Status status={resource?.status?.readyToUse ? 'Ready' : 'Not Ready'} />
                </div>
                <div className="co-restore-pvc-modal__pvc-details">
                  <strong>{t('console-app~Size')}</strong>
                  <p>{pvcRequestedSize}</p>
                </div>
              </GridItem>
              <GridItem span={6}>
                <div className="co-restore-pvc-modal__pvc-details">
                  <strong>{t('console-app~Namespace')}</strong>
                  <div>
                    <ResourceIcon kind={NamespaceModel.kind} />
                    <span>{namespace}</span>
                  </div>
                </div>
                <div className="co-restore-pvc-modal__pvc-details">
                  <strong>{t('console-app~API version')}</strong>
                  <p>{resource?.apiVersion}</p>
                </div>
              </GridItem>
            </Grid>
          </div>
        </ModalBody>
        <ModalSubmitFooter
          submitDisabled={!pvcSC || !validSize}
          inProgress={inProgress}
          errorMessage={errorMessage}
          submitText={t('console-app~Restore')}
          cancel={cancel}
        />
      </form>
    );
  },
);

type RestorePVCModalProps = {
  resource: VolumeSnapshotKind;
} & HandlePromiseProps &
  ModalComponentProps;

export default createModalLauncher(RestorePVCModal);
