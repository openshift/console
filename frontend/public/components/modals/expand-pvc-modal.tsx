import { useState, useCallback, FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
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
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalComponentProps } from '../factory/modal';
import { RequestSizeInput } from '../utils/request-size-input';
import { resourceObjPath } from '../utils/resource-link';
import { validate, convertToBaseValue, humanizeBinaryBytesWithoutB } from '../utils/units';
import { k8sPatch, referenceFor, K8sKind, K8sResourceKind } from '../../module/k8s/';
import { getRequestedPVCSize } from '@console/shared/src/selectors/storage';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

// Modal for expanding persistent volume claims
const ExpandPVCModal: FC<ExpandPVCModalProps> = ({ resource, kind, close, cancel }) => {
  const baseValue = convertToBaseValue(getRequestedPVCSize(resource));
  const defaultSize = validate.split(humanizeBinaryBytesWithoutB(baseValue).string);
  const [requestSizeValue, setRequestSizeValue] = useState(defaultSize[0] || '');
  const [requestSizeUnit, setRequestSizeUnit] = useState(defaultSize[1] || 'Gi');
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRequestSizeInputChange = (obj) => {
    setRequestSizeValue(obj.value);
    setRequestSizeUnit(obj.unit);
  };

  const submit = useCallback(
    (e) => {
      e.preventDefault();
      const patch = [
        {
          op: 'replace',
          path: '/spec/resources/requests',
          value: { storage: `${requestSizeValue}${requestSizeUnit}` },
        },
      ];

      handlePromise(k8sPatch(kind, resource, patch)).then((res) => {
        close();
        navigate(resourceObjPath(res, referenceFor(res)));
      });
    },
    [requestSizeValue, requestSizeUnit, kind, resource, close, handlePromise, navigate],
  );

  const dropdownUnits = {
    Mi: 'MiB',
    Gi: 'GiB',
    Ti: 'TiB',
  };

  return (
    <>
      <ModalHeader title={t('public~Expand {{kind}}', { kind: kind.label })} />
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
          <FormGroup label={t('public~Total size')} isRequired fieldId="pvc-expand-size-input">
            <RequestSizeInput
              name={t('public~requestSize')}
              required
              onChange={handleRequestSizeInputChange}
              defaultRequestSizeUnit={requestSizeUnit}
              defaultRequestSizeValue={requestSizeValue}
              dropdownUnits={dropdownUnits}
              testID="pvc-expand-size-input"
              minValue={defaultSize[0]}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isLoading={inProgress}
          isDisabled={inProgress}
          data-test="confirm-action"
          form="expand-pvc-form"
        >
          {t('public~Expand')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
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
