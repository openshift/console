import type { FC, FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import {
  snapshotPVCAccessModeAnnotation,
  snapshotPVCVolumeModeAnnotation,
} from '@console/internal/components/storage/shared';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { resourceListPathFromModel } from '@console/internal/components/utils/resource-link';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  PersistentVolumeClaimModel,
  VolumeGroupSnapshotClassModel,
  VolumeSnapshotModel,
} from '@console/internal/models';
import type {
  PersistentVolumeClaimKind,
  StorageClassResourceKind,
  VolumeGroupSnapshotClassKind,
  VolumeGroupSnapshotKind,
  VolumeSnapshotKind,
} from '@console/internal/module/k8s';
import { k8sCreate } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { getAnnotations, getName, getNamespace } from '@console/shared/src/selectors/common';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import { AccessModeSelector } from '../../access-modes/access-mode';

const RestoreVolumeGroupSnapshotModal: FC<RestoreVolumeGroupSnapshotModalProps> = ({
  close,
  cancel,
  resource,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler<void>();
  const { t } = useTranslation('console-app');
  const navigate = useNavigate();
  const namespace = getNamespace(resource);
  const groupSnapshotName = getName(resource);
  const [nameSuffix, setNameSuffix] = useState('-restore');
  const [pvcSC, setPVCStorageClass] = useState('');
  const [restoreAccessMode, setRestoreAccessMode] = useState('');
  const [updatedProvisioner, setUpdatedProvisioner] = useState('');
  // Names (with suffix) of PVCs already created by a prior, partially-failed submit.
  // A retry skips these instead of resubmitting them and hitting an AlreadyExists error.
  const [createdPVCNames, setCreatedPVCNames] = useState<Set<string>>(new Set());

  const [volumeSnapshots, vsLoaded, vsLoadError] = useK8sWatchResource<VolumeSnapshotKind[]>({
    groupVersionKind: {
      group: VolumeSnapshotModel.apiGroup,
      kind: VolumeSnapshotModel.kind,
      version: VolumeSnapshotModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });
  const vsLoadErrorMessage =
    vsLoadError instanceof Error ? vsLoadError.message : (vsLoadError as string);

  const [vgsClass, vgsClassLoaded, vgsClassLoadError] = useK8sGet<VolumeGroupSnapshotClassKind>(
    VolumeGroupSnapshotClassModel,
    resource?.spec?.volumeGroupSnapshotClassName,
  );
  const vgsClassLoadErrorMessage =
    vgsClassLoadError instanceof Error ? vgsClassLoadError.message : (vgsClassLoadError as string);

  // Restrict StorageClass choices to the snapshot's own driver, the same way the
  // single-snapshot restore modal filters by the source PVC's provisioner, so the
  // restored PVC can't end up on a StorageClass the snapshot content can't satisfy.
  const storageClassFilter = useCallback(
    (sc: StorageClassResourceKind) => !vgsClass?.driver || sc.provisioner === vgsClass.driver,
    [vgsClass],
  );

  const groupSnapshots = useMemo(
    () =>
      vsLoaded && !vsLoadError
        ? volumeSnapshots.filter((vs) =>
            vs?.metadata?.ownerReferences?.some(
              (ref) => ref.kind === 'VolumeGroupSnapshot' && ref.name === groupSnapshotName,
            ),
          )
        : [],
    [volumeSnapshots, vsLoaded, vsLoadError, groupSnapshotName],
  );

  const handleStorageClass = (sc: StorageClassResourceKind) => {
    setPVCStorageClass(sc?.metadata?.name || '');
    setUpdatedProvisioner(sc?.provisioner || '');
  };

  // StorageClassDropdown only calls onChange when its (re-filtered) item list has a
  // selectable entry. If vgsClass loads after the dropdown already auto-selected an
  // unfiltered default, and no compatible default exists, the dropdown falls back to
  // "Select StorageClass" without notifying us, leaving pvcSC/updatedProvisioner stale
  // at the now-incompatible class. Detect that directly instead of relying on the
  // dropdown to clear itself.
  const storageClassProvisionerMismatch =
    !!vgsClass?.driver && !!updatedProvisioner && updatedProvisioner !== vgsClass.driver;

  // Seed the access mode selector from the first snapshot's recorded PVC access
  // modes, the same way the single-PVC restore modal pre-fills from its source
  // snapshot, so the toggle shows a real value instead of staying blank.
  const availableAccessModes = getAnnotations(groupSnapshots[0])?.[
    snapshotPVCAccessModeAnnotation
  ]?.split(',');

  const pvcNames = useMemo(
    () =>
      groupSnapshots.map((vs) => {
        const sourcePVCName = vs?.spec?.source?.persistentVolumeClaimName || getName(vs);
        return `${sourcePVCName}${nameSuffix}`;
      }),
    [groupSnapshots, nameSuffix],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Skip PVCs a prior, partially-failed submit already created, so a retry only
    // resubmits the ones that failed instead of hitting an AlreadyExists conflict.
    const pendingSnapshots = groupSnapshots.filter((vs) => {
      const sourcePVCName = vs?.spec?.source?.persistentVolumeClaimName || getName(vs);
      return !createdPVCNames.has(`${sourcePVCName}${nameSuffix}`);
    });

    const creates = pendingSnapshots.map((vs) => {
      const sourcePVCName = vs?.spec?.source?.persistentVolumeClaimName || getName(vs);
      const pvcName = `${sourcePVCName}${nameSuffix}`;
      const volumeMode = getAnnotations(vs)?.[snapshotPVCVolumeModeAnnotation];
      const restorePVCTemplate: PersistentVolumeClaimKind = {
        apiVersion: PersistentVolumeClaimModel.apiVersion,
        kind: PersistentVolumeClaimModel.kind,
        metadata: {
          name: pvcName,
          namespace,
        },
        spec: {
          storageClassName: pvcSC,
          dataSource: {
            name: getName(vs),
            kind: VolumeSnapshotModel.kind,
            apiGroup: VolumeSnapshotModel.apiGroup,
          },
          accessModes: [restoreAccessMode],
          ...(volumeMode ? { volumeMode } : {}),
          resources: {
            requests: {
              storage: vs?.status?.restoreSize || '1Gi',
            },
          },
        },
      };
      return k8sCreate(PersistentVolumeClaimModel, restorePVCTemplate, { ns: namespace }).then(
        () => pvcName,
      );
    });

    const restoreAll = async () => {
      const results = await Promise.allSettled(creates);
      const succeeded = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map((result) => result.value);
      if (succeeded.length > 0) {
        setCreatedPVCNames((prev) => new Set([...prev, ...succeeded]));
      }
      const failedCount = results.length - succeeded.length;
      if (failedCount > 0) {
        throw new Error(
          t(
            '{{failedCount}} of {{total}} PVCs failed to create. Fix the issue and submit again to retry only the failed PVCs.',
            { failedCount, total: results.length },
          ),
        );
      }
    };

    handlePromise(restoreAll())
      .then(() => {
        close();
        navigate(resourceListPathFromModel(PersistentVolumeClaimModel, namespace));
      })
      .catch(() => {});
  };

  return (
    <>
      <ModalHeader
        title={t('Restore as new PVCs')}
        labelId="restore-volume-group-snapshot-modal-title"
      />
      <ModalBody>
        <Form id="restore-volume-group-snapshot-form" onSubmit={submit}>
          <FormGroup>
            <p>
              <Trans t={t} ns="console-app">
                Restoring <strong>{{ groupSnapshotName }}</strong> will create one new PVC per
                VolumeSnapshot in this group ({{ count: groupSnapshots.length }} snapshots).
              </Trans>
            </p>
          </FormGroup>
          <FormGroup label={t('Name suffix')} isRequired fieldId="pvc-name-suffix">
            <TextInput
              isRequired
              type="text"
              id="pvc-name-suffix"
              data-test="pvc-name-suffix"
              value={nameSuffix}
              onChange={(_event, value: string) => setNameSuffix(value)}
            />
          </FormGroup>
          {vsLoaded && pvcNames.length > 0 && (
            <FormGroup label={t('PVCs to be created')} fieldId="pvc-list">
              <Stack hasGutter>
                {pvcNames.map((name) => (
                  <StackItem key={name}>
                    <code>{name}</code>
                  </StackItem>
                ))}
              </Stack>
            </FormGroup>
          )}
          <FormGroup fieldId="restore-storage-class">
            <StorageClassDropdown
              onChange={handleStorageClass}
              filter={storageClassFilter}
              id="restore-storage-class"
              required
            />
          </FormGroup>
          <AccessModeSelector
            onChange={setRestoreAccessMode}
            provisioner={updatedProvisioner}
            loaded={vsLoaded}
            availableAccessModes={availableAccessModes}
          />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts
        errorMessage={
          errorMessage ||
          vsLoadErrorMessage ||
          vgsClassLoadErrorMessage ||
          (storageClassProvisionerMismatch
            ? t('Select a StorageClass that matches this VolumeGroupSnapshot driver.')
            : undefined)
        }
      >
        <Button
          type="submit"
          variant="primary"
          form="restore-volume-group-snapshot-form"
          data-test="confirm-action"
          id="confirm-action"
          isLoading={inProgress}
          isDisabled={
            !pvcSC ||
            !restoreAccessMode ||
            !nameSuffix ||
            groupSnapshots.length === 0 ||
            !vgsClassLoaded ||
            !!vgsClassLoadError ||
            storageClassProvisionerMismatch ||
            inProgress
          }
        >
          {t('Restore')}
        </Button>
        <Button
          variant="link"
          onClick={cancel}
          data-test="modal-cancel-action"
          data-test-id="modal-cancel-action"
        >
          {t('Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

type RestoreVolumeGroupSnapshotModalProps = {
  resource: VolumeGroupSnapshotKind;
} & ModalComponentProps;

export const RestoreVolumeGroupSnapshotModalOverlay: OverlayComponent<
  RestoreVolumeGroupSnapshotModalProps
> = (props) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={handleClose}
      aria-labelledby="restore-volume-group-snapshot-modal-title"
    >
      <RestoreVolumeGroupSnapshotModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};
