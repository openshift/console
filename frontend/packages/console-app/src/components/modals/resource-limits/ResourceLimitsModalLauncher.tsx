import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { Formik } from 'formik';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { limitsValidationSchema } from '@console/dev-console/src/components/import/validation-schema';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import { getLimitsDataFromResource, getResourceLimitsData } from '@console/shared/src';
import ResourceLimitsModal from './ResourceLimitsModal';

export type ResourceLimitsModalLauncherProps = {
  model: K8sKind;
  resource: K8sResourceKind;
} & ModalComponentProps;

const rlValidationSchema = (t: TFunction) =>
  yup.object().shape({
    limits: limitsValidationSchema(t),
  });

const ResourceLimitsModalLauncher: FC<ResourceLimitsModalLauncherProps> = (props) => {
  const { t } = useTranslation();

  const handleSubmit = (values, actions) => {
    const {
      limits: { cpu, memory },
    } = values;
    const resources = getResourceLimitsData({ cpu, memory });

    return k8sPatch(props.model, props.resource, [
      {
        op: 'replace',
        path: `/spec/template/spec/containers/0/resources`,
        value: resources,
      },
    ])
      .then(() => {
        props.close();
      })
      .catch((error) => {
        actions.setStatus({ submitError: error });
      });
  };

  const currentValues = {
    limits: getLimitsDataFromResource(props.resource),
    container: props.resource.spec.template.spec.containers[0].name,
  };

  return (
    <Formik
      initialValues={currentValues}
      onSubmit={handleSubmit}
      validationSchema={rlValidationSchema(t)}
    >
      {(formikProps) => <ResourceLimitsModal {...formikProps} {...props} />}
    </Formik>
  );
};

export const ResourceLimitsModalOverlay: OverlayComponent<ResourceLimitsModalLauncherProps> = (
  props,
) => {
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
      <ResourceLimitsModalLauncher {...props} close={handleClose} cancel={handleClose} />
    </Modal>
  ) : null;
};
