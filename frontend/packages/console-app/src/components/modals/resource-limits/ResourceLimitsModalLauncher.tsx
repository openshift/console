import * as React from 'react';
import { Formik } from 'formik';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { limitsValidationSchema } from '@console/dev-console/src/components/import/validation-schema';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { K8sKind, k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { getLimitsDataFromResource, getResourceLimitsData } from '@console/shared/src';
import ResourceLimitsModal from './ResourceLimitsModal';

export type ResourceLimitsModalLauncherProps = {
  model: K8sKind;
  resource: K8sResourceKind;
  close?: () => void;
} & ModalComponentProps;

const rlValidationSchema = (t: TFunction) =>
  yup.object().shape({
    limits: limitsValidationSchema(t),
  });

const ResourceLimitsModalLauncher: React.FC<ResourceLimitsModalLauncherProps> = (props) => {
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

export const resourceLimitsModal = createModalLauncher(
  (props: ResourceLimitsModalLauncherProps) => <ResourceLimitsModalLauncher {...props} />,
);
