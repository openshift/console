import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory';
import { DataPoint } from '@console/internal/components/graphs';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { dropdownUnits } from '@console/internal/components/storage/shared';
import {
  LoadingInline,
  ResourceIcon,
  humanizeBinaryBytes,
  history,
  withHandlePromise,
  RequestSizeInput,
  validate,
  resourceObjPath,
  convertToBaseValue,
  humanizeBinaryBytesWithoutB,
} from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { HandlePromiseProps } from '@console/internal/components/utils/promise-component';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  StorageClassModel,
} from '@console/internal/models';
import {
  k8sCreate,
  referenceFor,
  PersistentVolumeClaimKind,
  StorageClassResourceKind,
} from '@console/internal/module/k8s';
import { RedExclamationCircleIcon, isCephProvisioner } from '@console/shared';
import { getName, getRequestedPVCSize, onlyPvcSCs } from '@console/shared/src/selectors';
import { getPVCAccessModes, AccessModeSelector } from '../../access-modes/access-mode';

import './_clone-pvc-modal.scss';

const ClonePVCModal = withHandlePromise((props: ClonePVCModalProps) => {
  const { t } = useTranslation();
  const { close, cancel, resource, handlePromise, errorMessage, inProgress } = props;
  const { name: pvcName, namespace } = resource?.metadata;
  const baseValue = convertToBaseValue(getRequestedPVCSize(resource));
  const defaultSize: string[] = validate.split(humanizeBinaryBytesWithoutB(baseValue).string);
  const pvcRequestedSize = humanizeBinaryBytes(baseValue).string;

  const [clonePVCName, setClonePVCName] = React.useState(`${pvcName}-clone`);
  const [requestedSize, setRequestedSize] = React.useState(defaultSize[0] || '');
  const [cloneAccessMode, setCloneAccessMode] = React.useState(resource?.spec?.accessModes?.[0]);
  const [requestedUnit, setRequestedUnit] = React.useState(defaultSize[1] || 'Ti');
  const [validSize, setValidSize] = React.useState(true);
  const pvcAccessMode = getPVCAccessModes(resource, 'title');
  const [pvcSC, setPVCStorageClass] = React.useState('');
  const [updatedProvisioner, setUpdatedProvisioner] = React.useState('');
  const handleStorageClass = (updatedStorageClass: StorageClassResourceKind) => {
    setPVCStorageClass(getName(updatedStorageClass) || '');
    setUpdatedProvisioner(updatedStorageClass?.provisioner);
  };

  const [scResource, scResourceLoaded, scResourceLoadError] = useK8sGet<StorageClassResourceKind>(
    StorageClassModel,
    resource?.spec?.storageClassName,
  );

  const pvcUsedCapacityQuery: string = `kubelet_volume_stats_used_bytes{persistentvolumeclaim='${pvcName}'}`;
  const [response, error, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: pvcUsedCapacityQuery,
    namespace,
  });
  const pvcUsedCapacityQueryResult: DataPoint[] = getInstantVectorStats(
    response,
    null,
    humanizeBinaryBytes,
  );
  const pvcUsedCapacity = pvcUsedCapacityQueryResult?.[0]?.label || '-';
  const requestedSizeInputChange = ({ value, unit }) => {
    setRequestedSize(value);
    setRequestedUnit(unit);
    const cloneSizeInBytes = convertToBaseValue(value + unit);
    const pvcSizeInBytes = convertToBaseValue(getRequestedPVCSize(resource));
    const isValid = cloneSizeInBytes >= pvcSizeInBytes;
    setValidSize(isValid);
  };

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    const pvcCloneObj: PersistentVolumeClaimKind = {
      apiVersion: PersistentVolumeClaimModel.apiVersion,
      kind: PersistentVolumeClaimModel.kind,
      metadata: {
        name: clonePVCName,
        namespace: resource.metadata.namespace,
      },
      spec: {
        storageClassName: pvcSC,
        dataSource: {
          name: pvcName,
          kind: PersistentVolumeClaimModel.kind,
          apiGroup: '',
        },
        resources: {
          requests: {
            storage: `${requestedSize}${requestedUnit}`,
          },
        },
        volumeMode: resource.spec.volumeMode,
        accessModes: [cloneAccessMode],
      },
    };

    return handlePromise(k8sCreate(PersistentVolumeClaimModel, pvcCloneObj), (cloneResource) => {
      close();
      history.push(resourceObjPath(cloneResource, referenceFor(cloneResource)));
    });
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{t('console-app~Clone')}</ModalTitle>
      <ModalBody>
        <FormGroup
          label={t('console-app~Name')}
          isRequired
          fieldId="clone-pvc-modal__name"
          className="co-clone-pvc-modal__form--space"
        >
          <TextInput
            type="text"
            className="co-clone-pvc-modal__name--margin"
            data-test="pvc-name"
            value={clonePVCName}
            onChange={(_event, value) => setClonePVCName(value)}
            aria-label={t('console-app~Clone PVC')}
          />
        </FormGroup>
        <AccessModeSelector
          onChange={setCloneAccessMode}
          className="co-clone-pvc-modal__form--space"
          pvcResource={resource}
          provisioner={updatedProvisioner}
          loaded={scResourceLoaded}
          loadError={scResourceLoadError}
          filterByVolumeMode
        />
        <FormGroup
          label={t('console-app~Size')}
          isRequired
          fieldId="clone-pvc-modal__size"
          className="co-clone-pvc-modal__form--space"
        >
          {scResourceLoaded ? (
            <RequestSizeInput
              name="requestSize"
              testID="input-request-size"
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
                <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
                  {t('console-app~Size should be equal or greater than the requested size of PVC.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
        <FormGroup
          fieldId="clone-pvc-modal__storage-class"
          className="co-clone-pvc-modal__form--space"
        >
          {!scResourceLoaded ? (
            <div className="skeleton-text" />
          ) : (
            <StorageClassDropdown
              onChange={handleStorageClass}
              filter={(scObj: StorageClassResourceKind) =>
                onlyPvcSCs(scObj, scResourceLoadError, scResource)
              }
              id="clone-storage-class"
              data-test="storage-class-dropdown"
              required
              selectedKey={getName(scResource)}
            />
          )}
        </FormGroup>
        <div className="co-clone-pvc-modal__details">
          <p className="text-muted">{t('console-app~PVC details')}</p>
          <div className="co-clone-pvc-modal__details-section">
            <div>
              <div>
                <p className="co-clone-pvc-modal__pvc-details">{t('console-app~Namespace')}</p>
                <p>
                  <ResourceIcon kind={NamespaceModel.kind} />
                  {resource.metadata.namespace}
                </p>
              </div>
              <div>
                <p className="co-clone-pvc-modal__pvc-details">{t('console-app~StorageClass')}</p>
                <p>
                  <ResourceIcon kind={StorageClassModel.kind} />
                  {pvcSC || '-'}
                </p>
              </div>
            </div>
            <div>
              <div>
                <p className="co-clone-pvc-modal__pvc-details">
                  {t('console-app~Requested capacity')}
                </p>
                <p>{pvcRequestedSize}</p>
              </div>
              <div>
                <p className="co-clone-pvc-modal__pvc-details">{t('console-app~Used capacity')}</p>
                <div>
                  {!loading && !error && pvcUsedCapacity}
                  {loading && <LoadingInline />}
                  {!loading && error && '-'}
                </div>
              </div>
            </div>
            <div>
              <div>
                <p className="co-clone-pvc-modal__pvc-details">{t('console-app~Access mode')}</p>
                <p>{pvcAccessMode.join(', ') || '-'}</p>
              </div>
              <div>
                <p className="co-clone-pvc-modal__pvc-details">{t('console-app~Volume mode')}</p>
                <p>{resource.spec.volumeMode}</p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        submitDisabled={!validSize || !pvcSC}
        errorMessage={errorMessage}
        submitText={t('console-app~Clone')}
        cancel={cancel}
      />
    </form>
  );
});

export type ClonePVCModalProps = {
  resource?: PersistentVolumeClaimKind;
} & HandlePromiseProps &
  ModalComponentProps;

export default createModalLauncher(ClonePVCModal);
