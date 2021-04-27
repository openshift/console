import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import {
  RequestSizeInput,
  resourceObjPath,
  history,
  validate,
  withHandlePromise,
  HandlePromiseProps,
} from '../utils';
import { k8sPatch, referenceFor, K8sKind, K8sResourceKind } from '../../module/k8s/';
import { getRequestedPVCSize } from '@console/shared';

// Modal for expanding persistent volume claims
const ExpandPVCModal = withHandlePromise((props: ExpandPVCModalProps) => {
  const defaultSize = validate.split(getRequestedPVCSize(props.resource));
  const [requestSizeValue, setRequestSizeValue] = React.useState(defaultSize[0] || '');
  const [requestSizeUnit, setRequestSizeUnit] = React.useState(defaultSize[1] || 'Gi');
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [inProgress, setInProgress] = React.useState(false);

  const { t } = useTranslation();

  const handleRequestSizeInputChange = (obj) => {
    setRequestSizeValue(obj.value);
    setRequestSizeUnit(obj.unit);
  };

  const submit = (e) => {
    e.preventDefault();
    const patch = [
      {
        op: 'replace',
        path: '/spec/resources/requests',
        value: { storage: `${requestSizeValue}${requestSizeUnit}` },
      },
    ];
    setInProgress(true);
    k8sPatch(props.kind, props.resource, patch)
      .then((resource) => {
        setInProgress(false);
        props.close();
        history.push(resourceObjPath(resource, referenceFor(resource)));
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setInProgress(false);
      });
  };

  const { kind, resource } = props;

  const dropdownUnits = {
    Mi: 'MiB',
    Gi: 'GiB',
    Ti: 'TiB',
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
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
        <label className="control-label co-required">{t('public~Total size')}</label>
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
        cancel={props.cancel}
      />
    </form>
  );
});

export const expandPVCModal = createModalLauncher(ExpandPVCModal);

export type ExpandPVCModalProps = {
  kind: K8sKind;
  resource: K8sResourceKind;
  cancel?: () => void;
  close: () => void;
} & HandlePromiseProps;
