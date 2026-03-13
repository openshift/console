import { useNavigate } from 'react-router-dom-v5-compat';
import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { resourceListPathFromModel } from '../utils/resource-link';
import { getName } from '@console/shared/src/selectors/common';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { isPVCDelete, PVCDelete } from '@console/dynamic-plugin-sdk/src/extensions/pvc';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalComponentProps } from '../factory';
import { k8sKill, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { PersistentVolumeClaimModel } from '../../models';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

const DeletePVCModal = (props: DeletePVCModalProps) => {
  const { pvc, close, cancel } = props;
  const [pvcDeleteExtensions] = useResolvedExtensions<PVCDelete>(isPVCDelete);
  const pvcName = getName(pvc);
  const { t } = useTranslation();
  const pvcMetadata = { metadata: { ...pvc?.metadata } };
  const navigate = useNavigate();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sKill(PersistentVolumeClaimModel, pvc);
    const extensionPromises = pvcDeleteExtensions.map(
      ({ properties: { predicate, onPVCKill } }) =>
        predicate(pvcMetadata) && onPVCKill(pvcMetadata),
    );

    handlePromise(Promise.all([promise, ...extensionPromises])).then(() => {
      close();
      navigate(resourceListPathFromModel(PersistentVolumeClaimModel, pvc.metadata.namespace));
    });
  };

  const alertComponents = pvcDeleteExtensions.map(
    ({ properties: { predicate, alert: PVCAlert }, uid }) =>
      predicate(pvcMetadata) && (
        <StackItem key={uid}>
          <PVCAlert pvc={pvcMetadata} />
        </StackItem>
      ),
  );

  return (
    <>
      <ModalHeader
        title={t('public~Delete PersistentVolumeClaim')}
        titleIconVariant="warning"
        data-test-id="modal-title"
        labelId="delete-pvc-modal-title"
      />
      <ModalBody>
        <Form id="delete-pvc-form" onSubmit={submit}>
          <Stack hasGutter>
            {alertComponents}
            <StackItem>
              <Trans t={t} ns="public">
                Are you sure you want to delete{' '}
                <strong className="co-break-word">{{ pvcName }}</strong> PersistentVolumeClaim?
              </Trans>
            </StackItem>
          </Stack>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="danger"
          isLoading={inProgress}
          isDisabled={inProgress}
          form="delete-pvc-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Delete')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export type DeletePVCModalProps = {
  pvc: PersistentVolumeClaimKind;
} & ModalComponentProps;

export const DeletePVCModalOverlay: OverlayComponent<DeletePVCModalProps> = (props) => {
  return (
    <Modal
      isOpen
      onClose={props.closeOverlay}
      variant={ModalVariant.small}
      aria-labelledby="delete-pvc-modal-title"
    >
      <DeletePVCModal {...props} cancel={props.closeOverlay} close={props.closeOverlay} />
    </Modal>
  );
};
