import { useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import {
  RequestSizeInput,
  resourceObjPath,
  validate,
  convertToBaseValue,
  humanizeBinaryBytesWithoutB,
} from '../utils';
import { k8sPatch, referenceFor, K8sKind, K8sResourceKind } from '../../module/k8s/';
import { getRequestedPVCSize } from '@console/shared';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

// Modal for expanding persistent volume claims
const ExpandPVCModal = ({ resource, kind, close, cancel }: ExpandPVCModalProps) => {
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
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{t('public~Expand {{kind}}', { kind: kind.label })}</ModalTitle>
      <ModalBody>
        <p>
          <Trans t={t} ns="public">
            Increase the capacity of PVC{' '}
            <strong className="co-break-word">{{ resourceName: resource.metadata.name }}.</strong>{' '}
            Note that capacity can't be less than the current PVC size. This can be a time-consuming
            process.
          </Trans>
        </p>
        <label className="co-required">{t('public~Total size')}</label>
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
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Expand')}
        cancel={cancel}
      />
    </form>
  );
};

export const expandPVCModal = createModalLauncher(ExpandPVCModal);

export type ExpandPVCModalProps = {
  kind: K8sKind;
  resource: K8sResourceKind;
  cancel?: () => void;
  close: () => void;
};
