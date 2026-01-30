import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  FormGroup,
  FormHelperText,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Skeleton,
  TextInput,
} from '@patternfly/react-core';
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
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { RequestSizeInput } from '@console/internal/components/utils/request-size-input';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { history } from '@console/internal/components/utils/router';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  convertToBaseValue,
  humanizeBinaryBytesWithoutB,
  humanizeBinaryBytes,
} from '@console/internal/components/utils/units';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  StorageClassModel,
} from '@console/internal/models';
import {
  k8sCreate,
  VolumeSnapshotKind,
  StorageClassResourceKind,
  PersistentVolumeClaimKind,
} from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Status } from '@console/shared/src/components/status/Status';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { getName, getNamespace, getAnnotations } from '@console/shared/src/selectors/common';
import { onlyPvcSCs } from '@console/shared/src/selectors/storage';
import { isCephProvisioner } from '@console/shared/src/utils/storage-utils';
import { AccessModeSelector } from '../../access-modes/access-mode';

import './restore-pvc-modal.scss';

const RestorePVCModal = ({ close, cancel, resource }: RestorePVCModalProps) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler<PersistentVolumeClaimKind>();
  const { t } = useTranslation();
  const [restorePVCName, setPVCName] = useState(`${getName(resource) ?? 'pvc'}-restore`);
  const volumeSnapshotAnnotations = getAnnotations(resource);
  const snapshotBaseSize = convertToBaseValue(resource?.status?.restoreSize ?? '0');
  const snapshotHumanizedSize = humanizeBinaryBytesWithoutB(snapshotBaseSize);
  const [requestedSize, setRequestedSize] = useState(snapshotHumanizedSize.value);
  const [requestedUnit, setRequestedUnit] = useState(snapshotHumanizedSize.unit);
  const [pvcSC, setPVCStorageClass] = useState('');
  const requestedBytes = convertToBaseValue(requestedSize + requestedUnit);
  const validSize = requestedBytes >= snapshotBaseSize;
  const [restoreAccessMode, setRestoreAccessMode] = useState('');
  const [updatedProvisioner, setUpdatedProvisioner] = useState('');
  const namespace = getNamespace(resource);
  const snapshotName = getName(resource);

  const [pvcResource, pvcResourceLoaded, pvcResourceLoadError] = useK8sGet<
    PersistentVolumeClaimKind
  >(PersistentVolumeClaimModel, resource?.spec?.source?.persistentVolumeClaimName, namespace);

  const pvcStorageClassName = pvcResource?.spec?.storageClassName;
  const [scResource, scResourceLoaded, scResourceLoadError] = useK8sGet<StorageClassResourceKind>(
    StorageClassModel,
    pvcStorageClassName,
  );

  const [volumeMode, setVolumeMode] = useState('');
  const requestedSizeInputChange = ({ value, unit }) => {
    setRequestedSize(value);
    setRequestedUnit(unit);
  };

  const handleStorageClass = (updatedStorageClass: StorageClassResourceKind) => {
    setPVCStorageClass(updatedStorageClass?.metadata?.name ?? '');
    setUpdatedProvisioner(updatedStorageClass?.provisioner);
  };

  const submit = (event: FormEvent<EventTarget>) => {
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
          apiGroup: VolumeSnapshotModel.apiGroup ?? '',
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

    return handlePromise(
      k8sCreate(PersistentVolumeClaimModel, restorePVCTemplate, { ns: namespace }),
    ).then((newPVC) => {
      close?.();
      history.push(
        resourcePathFromModel(PersistentVolumeClaimModel, newPVC.metadata.name, namespace),
      );
    });
  };
  return (
    <form onSubmit={submit} name="form" className="modal-content pf-v6-c-form pf-v6-c-form--no-gap">
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
            onChange={(_event, value: string) => setPVCName(value)}
          />
        </FormGroup>
        <FormGroup fieldId="restore-storage-class" className="co-restore-pvc-modal__input">
          {!pvcStorageClassName || !scResourceLoaded ? (
            <div className="skeleton-text" />
          ) : (
            <StorageClassDropdown
              onChange={handleStorageClass}
              filter={(scObj: StorageClassResourceKind) =>
                onlyPvcSCs(scObj, scResourceLoadError, scResource)
              }
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
          availableAccessModes={volumeSnapshotAnnotations?.[snapshotPVCAccessModeAnnotation]?.split(
            ',',
          )}
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
        >
          {!!pvcStorageClassName && scResourceLoaded ? (
            <RequestSizeInput
              name="requestSize"
              onChange={requestedSizeInputChange}
              defaultRequestSizeUnit={requestedUnit}
              defaultRequestSizeValue={requestedSize}
              dropdownUnits={dropdownUnits}
              isInputDisabled={scResourceLoadError || isCephProvisioner(scResource?.provisioner)}
              required
            />
          ) : (
            <div className="skeleton-text" />
          )}

          {!validSize && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error">
                  {t(
                    'console-app~Size should be equal or greater than the restore size of snapshot.',
                  )}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
        <div className="co-restore-pvc-modal__details-section">
          <p className="pf-v6-u-text-color-subtle">
            {t('console-app~{{resourceKind}} details', {
              resourceKind: VolumeSnapshotModel.label,
            })}
          </p>
          <Grid hasGutter>
            <GridItem span={6}>
              <div className="co-restore-pvc-modal__pvc-details">
                <strong>{t('console-app~Created at')}</strong>
                <span>
                  <Timestamp timestamp={resource?.metadata.creationTimestamp} />
                </span>
              </div>
              <div className="co-restore-pvc-modal__pvc-details">
                <strong>{t('console-app~Status')}</strong>
                <Status status={resource?.status?.readyToUse ? 'Ready' : 'Not Ready'} />
              </div>
              <div className="co-restore-pvc-modal__pvc-details">
                <strong>{t('console-app~Size')}</strong>
                <p>{humanizeBinaryBytes(snapshotBaseSize).string}</p>
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
};

type RestorePVCModalProps = {
  resource: VolumeSnapshotKind;
} & ModalComponentProps;

export default createModalLauncher(RestorePVCModal);
