import { useState } from 'react';
import type { FC } from 'react';
import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  TextInputTypes,
} from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { Formik } from 'formik';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { usePromiseHandler } from '../../hooks/promise-handler';
import { InputField } from '../formik-fields';
import { ModalFooterWithAlerts } from './ModalFooterWithAlerts';

const DeleteResourceForm: FC<FormikProps<FormikValues> & DeleteResourceModalProps> = ({
  handleSubmit,
  resourceName,
  resourceType,
  actionLabel,
  // t('console-shared~Delete')
  actionLabelKey = 'console-shared~Delete',
  isSubmitting,
  cancel,
  values,
  status,
}) => {
  const { t } = useTranslation();
  const isValid = values.resourceName === resourceName;
  const submitLabel = actionLabel || t(actionLabelKey);

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <>
      <ModalHeader title={<>{resourceType}?</>} titleIconVariant="warning" />
      <ModalBody>
        <Form id="delete-resource-modal-form">
          <p>
            {t(
              `console-shared~This action cannot be undone. All associated Deployments, Routes, Builds, Pipelines, Storage/PVCs, Secrets, and ConfigMaps will be deleted.`,
            )}
          </p>
          <p>
            <Trans ns="console-shared">
              Confirm deletion by typing{' '}
              <strong className="co-break-word">{{ resourceName }}</strong> below:
            </Trans>
          </p>
          <InputField type={TextInputTypes.text} name="resourceName" />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status && status.submitError}>
        <Button
          type="submit"
          variant="danger"
          onClick={onSubmit}
          form="delete-resource-modal-form"
          isLoading={isSubmitting}
          isDisabled={(status && !!status.submitError) || !isValid || isSubmitting}
          data-test="confirm-action"
        >
          {submitLabel}
        </Button>
        <Button variant="link" onClick={cancel}>
          {t('console-shared~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

const DeleteResourceModal: FC<DeleteResourceModalProps> = (props) => {
  const [handlePromise] = usePromiseHandler();
  const navigate = useNavigate();

  const handleSubmit = (values: FormikValues, actions) => {
    const { onSubmit, close, redirect } = props;
    actions.setStatus({ submitError: null });
    return (
      onSubmit &&
      handlePromise(onSubmit(values))
        .then(() => {
          close();
          if (redirect) {
            navigate(redirect);
          }
        })
        .catch((errorMessage) => {
          actions.setStatus({ submitError: errorMessage });
        })
    );
  };

  const initialValues = {
    resourceName: '',
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {(formikProps) => <DeleteResourceForm {...formikProps} {...props} />}
    </Formik>
  );
};

export const DeleteResourceModalOverlay: OverlayComponent<DeleteResourceModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <DeleteResourceModal
        close={handleClose}
        cancel={handleClose}
        resourceName={props.resourceName}
        resourceType={props.resourceType}
        actionLabel={props.actionLabel}
        actionLabelKey={props.actionLabelKey}
        redirect={props.redirect}
        onSubmit={props.onSubmit}
      />
    </Modal>
  ) : null;
};

type DeleteResourceModalProps = ModalComponentProps & {
  resourceName: string;
  resourceType: string;
  actionLabel?: string; // Used to send translated strings as action label.
  actionLabelKey?: string; // Used to send translation key for action label.
  redirect?: string;
  onSubmit: (values: FormikValues) => Promise<K8sResourceKind[]>;
};
