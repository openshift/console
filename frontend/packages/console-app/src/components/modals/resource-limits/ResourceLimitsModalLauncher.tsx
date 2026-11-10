import type { FC } from 'react';
import { useState } from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { Formik } from 'formik';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { limitsValidationSchema } from '@console/dev-console/src/components/import/validation-schema';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import {
  getLimitsDataFromResource,
  mergeResourceLimitsData,
} from '@console/shared/src/utils/resource-utils';
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
  const { t } = useTranslation('console-app');

  const handleSubmit = (values, actions) => {
    const {
      limits: { cpu, memory },
    } = values;
    // Merge the edited CPU/memory into the container's existing resources so
    // that keys the form does not model (e.g. ephemeral-storage, hugepages)
    // are preserved rather than dropped. See OCPBUGS-135948.
    const existingResources = props.resource?.spec?.template?.spec?.containers?.[0]?.resources;
    const resources = mergeResourceLimitsData({ cpu, memory }, existingResources);

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

  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={handleClose}
      aria-labelledby="resource-limits-modal-title"
    >
      <ResourceLimitsModalLauncher {...props} close={handleClose} cancel={handleClose} />
    </Modal>
  ) : null;
};
