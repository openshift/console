import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  FormHelperText,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory';
import type { DataPoint } from '@console/internal/components/graphs';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { dropdownUnits } from '@console/internal/components/storage/shared';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { RequestSizeInput } from '@console/internal/components/utils/request-size-input';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  humanizeBinaryBytes,
  humanizeBinaryBytesWithoutB,
  convertToBaseValue,
  validate,
} from '@console/internal/components/utils/units';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  StorageClassModel,
} from '@console/internal/models';
import type {
  PersistentVolumeClaimKind,
  StorageClassResourceKind,
} from '@console/internal/module/k8s';
import { k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { getName, getRequestedPVCSize, onlyPvcSCs } from '@console/shared/src/selectors';
import { isCephProvisioner } from '@console/shared/src/utils/storage-utils';
import { getPVCAccessModes, AccessModeSelector } from '../../access-modes/access-mode';

const ClonePVCModal = (props: ClonePVCModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { close, cancel, resource } = props;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler<PersistentVolumeClaimKind>();
  const { name: pvcName, namespace } = resource?.metadata;
  const baseValue = convertToBaseValue(getRequestedPVCSize(resource));
  const defaultSize: string[] = validate.split(humanizeBinaryBytesWithoutB(baseValue).string);
  const pvcRequestedSize = humanizeBinaryBytes(baseValue).string;

  const [clonePVCName, setClonePVCName] = useState(`${pvcName}-clone`);
  const [requestedSize, setRequestedSize] = useState(defaultSize[0] || '');
  const [cloneAccessMode, setCloneAccessMode] = useState(resource?.spec?.accessModes?.[0]);
  const [requestedUnit, setRequestedUnit] = useState(defaultSize[1] || 'Ti');
  const [validSize, setValidSize] = useState(true);
  const pvcAccessMode = getPVCAccessModes(resource, 'title');
  const [pvcSC, setPVCStorageClass] = useState('');
  const [updatedProvisioner, setUpdatedProvisioner] = useState('');
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

  const submit = (event: FormEvent<EventTarget>) => {
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

    handlePromise(k8sCreate(PersistentVolumeClaimModel, pvcCloneObj))
      .then((cloneResource) => {
        close();
        navigate(resourceObjPath(cloneResource, referenceFor(cloneResource)));
      })
      .catch(() => {});
  };

  return (
    <>
      <ModalHeader title={t('console-app~Clone')} />
      <ModalBody>
        <Form id="clone-pvc-form">
          <FormGroup label={t('console-app~Name')} isRequired fieldId="clone-pvc-modal__name">
            <TextInput
              type="text"
              data-test="pvc-name"
              value={clonePVCName}
              onChange={(_event, value) => setClonePVCName(value)}
              aria-label={t('console-app~Clone PVC')}
            />
          </FormGroup>
          <AccessModeSelector
            onChange={setCloneAccessMode}
            pvcResource={resource}
            provisioner={updatedProvisioner}
            loaded={scResourceLoaded}
            loadError={scResourceLoadError}
            filterByVolumeMode
          />
          <FormGroup label={t('console-app~Size')} isRequired fieldId="clone-pvc-modal__size">
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
                  <HelperTextItem variant="error">
                    {t(
                      'console-app~Size should be equal or greater than the requested size of PVC.',
                    )}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup fieldId="clone-pvc-modal__storage-class">
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
          <FormGroup>
            <p className="pf-v6-u-text-color-subtle pf-v6-u-mb-md">
              {t('console-app~PVC details')}
            </p>
            <Grid hasGutter md={4}>
              <GridItem>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('console-app~Namespace')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ResourceIcon kind={NamespaceModel.kind} />
                      {resource.metadata.namespace}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('console-app~StorageClass')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ResourceIcon kind={StorageClassModel.kind} />
                      {pvcSC || '-'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </GridItem>
              <GridItem>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('console-app~Requested capacity')}</DescriptionListTerm>
                    <DescriptionListDescription>{pvcRequestedSize}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('console-app~Used capacity')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {!loading && !error && pvcUsedCapacity}
                      {loading && <LoadingInline />}
                      {!loading && error && '-'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </GridItem>
              <GridItem>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('console-app~Access mode')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {pvcAccessMode.join(', ') || '-'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('console-app~Volume mode')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {resource.spec.volumeMode}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </GridItem>
            </Grid>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          onClick={submit}
          form="clone-pvc-form"
          isLoading={inProgress}
          isDisabled={!validSize || !pvcSC || inProgress}
        >
          {t('console-app~Clone')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('console-app~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export type ClonePVCModalProps = {
  resource?: PersistentVolumeClaimKind;
} & ModalComponentProps;

export const ClonePVCModalOverlay: OverlayComponent<ClonePVCModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);

  // Move focus away from the triggering element to prevent aria-hidden warning
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <ClonePVCModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};
