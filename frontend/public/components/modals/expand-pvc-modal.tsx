import type { FC } from 'react';
import { useState, useCallback } from 'react';
import {
  Button,
  Content,
  ContentVariants,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { getRequestedPVCSize } from '@console/shared/src/selectors/storage';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import { k8sPatch, referenceFor } from '../../module/k8s';
import type { K8sKind, K8sResourceKind } from '../../module/k8s';
import { dropdownUnits } from '../storage/shared';
import { RequestSizeInput } from '../utils/request-size-input';
import { resourceObjPath } from '../utils/resource-link';
import { convertToBaseValue, humanizeBinaryBytesWithoutB } from '../utils/units';

/**
 * Build the initial size/unit pair for Expand.
 * Always humanize from bytes (same approach as Clone / PVC details) so API-canonical
 * forms like `1536Mi` open as `1.5Gi` instead of switching units on the user.
 * When display rounding would fall below the current request (e.g. `2G` → `1.86Gi`),
 * use the exact byte-derived value in the chosen unit instead.
 */
export const getInitialExpandSize = (requestedStorage: string): { value: string; unit: string } => {
  const bytes = convertToBaseValue(requestedStorage);
  if (bytes == null || bytes <= 0) {
    return { value: '1', unit: 'Gi' };
  }

  const humanized = humanizeBinaryBytesWithoutB(bytes);
  const unit = humanized.unit && humanized.unit in dropdownUnits ? humanized.unit : 'Gi';
  const unitBytes = convertToBaseValue(`1${unit}`);
  if (!unitBytes || unitBytes <= 0) {
    return { value: '1', unit: 'Gi' };
  }

  const roundedBytes = convertToBaseValue(`${humanized.value}${unit}`);
  if (roundedBytes !== null && roundedBytes >= bytes) {
    return { value: String(humanized.value), unit };
  }

  // Preserve the current request exactly when humanize rounding undershoots.
  return { value: String(bytes / unitBytes), unit };
};

/** Spinner min expressed in the currently selected unit (e.g. 1591Mi → ~1.55 when unit is Gi). */
export const getMinValueInSelectedUnit = (minBytes: number, unit: string, fallback = 0): number => {
  const unitBytes = convertToBaseValue(`1${unit}`);
  if (!unitBytes || unitBytes <= 0) {
    return fallback;
  }
  return minBytes / unitBytes;
};

export const isExpandSizeValid = (
  value: string | number,
  unit: string,
  minBytes: number,
): boolean => {
  const nextBytes = convertToBaseValue(`${value}${unit}`);
  return nextBytes !== null && nextBytes >= minBytes;
};

// Modal for expanding persistent volume claims
const ExpandPVCModal: FC<ExpandPVCModalProps> = ({ resource, kind, close, cancel }) => {
  const requestedStorage = getRequestedPVCSize(resource) || '';
  const initialSize = getInitialExpandSize(requestedStorage);
  const minBytes = convertToBaseValue(requestedStorage) || 0;
  const [requestSizeValue, setRequestSizeValue] = useState(initialSize.value);
  const [requestSizeUnit, setRequestSizeUnit] = useState<string>(initialSize.unit);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const { t } = useTranslation('public');
  const navigate = useNavigate();

  const handleRequestSizeInputChange = (obj: { value: string | number; unit: string }) => {
    setRequestSizeValue(String(obj.value));
    setRequestSizeUnit(obj.unit);
  };

  const isValidExpand = isExpandSizeValid(requestSizeValue, requestSizeUnit, minBytes);
  const minValueInSelectedUnit = getMinValueInSelectedUnit(
    minBytes,
    requestSizeUnit,
    Number(initialSize.value) || 0,
  );

  const submit = useCallback(
    (e) => {
      e.preventDefault();
      if (!isValidExpand) {
        return;
      }
      const patch = [
        {
          op: 'replace',
          path: '/spec/resources/requests',
          value: { storage: `${requestSizeValue}${requestSizeUnit}` },
        },
      ];

      handlePromise(k8sPatch(kind, resource, patch))
        .then((res) => {
          close();
          navigate(resourceObjPath(res, referenceFor(res)));
        })
        .catch(() => {});
    },
    [
      isValidExpand,
      requestSizeValue,
      requestSizeUnit,
      kind,
      resource,
      close,
      handlePromise,
      navigate,
    ],
  );

  return (
    <>
      <ModalHeader title={t('Expand {{kind}}', { kind: kind.label })} />
      <ModalBody>
        <Content component={ContentVariants.p}>
          <Trans t={t} ns="public">
            Increase the capacity of PVC{' '}
            <strong className="co-break-word">{{ resourceName: resource.metadata.name }}.</strong>{' '}
            Note that capacity must be at least the current PVC size. This expansion might take some
            time to complete.
          </Trans>
        </Content>
        <Form id="expand-pvc-form" onSubmit={submit}>
          <FormGroup label={t('Total size')} isRequired fieldId="pvc-expand-size-input">
            <RequestSizeInput
              name={t('requestSize')}
              required
              onChange={handleRequestSizeInputChange}
              defaultRequestSizeUnit={requestSizeUnit}
              defaultRequestSizeValue={requestSizeValue}
              dropdownUnits={dropdownUnits}
              testID="pvc-expand-size-input"
              minValue={minValueInSelectedUnit}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isLoading={inProgress}
          isDisabled={inProgress || !isValidExpand}
          data-test="confirm-action"
          form="expand-pvc-form"
        >
          {t('Expand')}
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

export type ExpandPVCModalProps = {
  kind: K8sKind;
  resource: K8sResourceKind;
} & ModalComponentProps;

export const ExpandPVCModalOverlay: OverlayComponent<ExpandPVCModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <ExpandPVCModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};
