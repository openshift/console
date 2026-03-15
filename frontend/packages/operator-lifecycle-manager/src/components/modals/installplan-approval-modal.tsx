import type { FC, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Radio,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { modelFor, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import { SubscriptionModel, InstallPlanModel } from '../../models';
import type { SubscriptionKind, InstallPlanKind } from '../../types';
import { InstallPlanApproval } from '../../types';

const getApprovalStrategy = (obj: InstallPlanKind | SubscriptionKind): InstallPlanApproval =>
  (obj as SubscriptionKind)?.spec?.installPlanApproval ??
  (obj as InstallPlanKind)?.spec?.approval ??
  InstallPlanApproval.Automatic;

export const InstallPlanApprovalModal: FC<InstallPlanApprovalModalProps> = ({
  cancel,
  close,
  k8sUpdate,
  obj,
}) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [selectedApprovalStrategy, setSelectedApprovalStrategy] = useState(
    getApprovalStrategy(obj),
  );
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const updatedObj = _.cloneDeep(obj);
      if (referenceFor(updatedObj) === referenceForModel(SubscriptionModel)) {
        (updatedObj as SubscriptionKind).spec.installPlanApproval = selectedApprovalStrategy;
      } else if (referenceFor(updatedObj) === referenceForModel(InstallPlanModel)) {
        (updatedObj as InstallPlanKind).spec.approval = selectedApprovalStrategy;
      }
      handlePromise(k8sUpdate(modelFor(referenceFor(obj)), updatedObj))
        .then(() => close?.())
        .catch(_.noop);
    },
    [close, handlePromise, k8sUpdate, obj, selectedApprovalStrategy],
  );

  return (
    <>
      <ModalHeader
        title={t('olm~Change update approval strategy')}
        data-test-id="modal-title"
        labelId="installplan-approval-modal-title"
      />
      <ModalBody>
        <Form id="installplan-approval-form" onSubmit={submit}>
          <FormGroup
            label={t('olm~What strategy is used for approving updates?')}
            fieldId="approval-strategy"
            role="radiogroup"
          >
            <Radio
              id="approval-strategy-automatic"
              name="approval-strategy"
              value={InstallPlanApproval.Automatic}
              label={`${t(`olm~Automatic`)} (${t('public~default')})`}
              description={t('olm~New updates will be installed as soon as they become available.')}
              onChange={() => setSelectedApprovalStrategy(InstallPlanApproval.Automatic)}
              isChecked={selectedApprovalStrategy === InstallPlanApproval.Automatic}
              data-checked-state={selectedApprovalStrategy === InstallPlanApproval.Automatic}
            />
            <Radio
              id="approval-strategy-manual"
              name="approval-strategy"
              value={InstallPlanApproval.Manual}
              label={t('olm~Manual')}
              description={t(
                'olm~New updates need to be manually approved before installation begins.',
              )}
              onChange={() => setSelectedApprovalStrategy(InstallPlanApproval.Manual)}
              isChecked={selectedApprovalStrategy === InstallPlanApproval.Manual}
              data-checked-state={selectedApprovalStrategy === InstallPlanApproval.Manual}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          form="installplan-approval-form"
          isLoading={inProgress}
          isDisabled={inProgress || getApprovalStrategy(obj) === selectedApprovalStrategy}
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export type InstallPlanApprovalModalProps = {
  k8sUpdate: (kind: K8sKind, newObj: K8sResourceKind) => Promise<any>;
  obj: InstallPlanKind | SubscriptionKind;
} & ModalComponentProps;

export const InstallPlanApprovalModalOverlay: OverlayComponent<InstallPlanApprovalModalProps> = (
  props,
) => {
  return (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={props.closeOverlay}
      aria-labelledby="installplan-approval-modal-title"
    >
      <InstallPlanApprovalModal {...props} close={props.closeOverlay} cancel={props.closeOverlay} />
    </Modal>
  );
};
