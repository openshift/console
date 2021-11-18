import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { createModalLauncher } from '@console/internal/components/factory/modal';
import { K8sKind, k8sList, K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceBindingModel } from '@console/topology/src/models';
import { createServiceBinding } from '@console/topology/src/operators/actions/serviceBindings';
import CreateServiceBindingForm, {
  CreateServiceBindingFormProps,
} from './CreateServiceBindingForm';
import { checkExistingServiceBinding } from './service-binding-modal-launcher-utils';
import { serviceBindingValidationSchema } from './servicebinding-validation-utils';

type CreateServiceBindingModalProps = CreateServiceBindingFormProps & {
  model: K8sKind;
  resource: K8sResourceKind;
  close?: () => void;
};

const CreateServiceBindingModal: React.FC<CreateServiceBindingModalProps> = (props) => {
  const { resource, model } = props;
  const { t } = useTranslation();
  const handleSubmit = async (values, actions) => {
    const bindings: K8sResourceKind[] = await k8sList(ServiceBindingModel, {
      ns: resource.metadata.namespace,
    });
    let existingServiceBinding = {};
    if (bindings.length > 0) {
      existingServiceBinding = checkExistingServiceBinding(
        bindings,
        resource,
        values.bindableService,
        model,
      );
    }
    if (_.isEmpty(existingServiceBinding)) {
      try {
        await createServiceBinding(resource, values.bindableService, values.name);
        props.close();
      } catch (errorMessage) {
        actions.setStatus({ submitError: errorMessage.message });
      }
    } else {
      actions.setStatus({
        submitError: t(
          'console-app~Service binding already exists. Select another service to create a binding with.',
        ),
      });
    }
  };

  const initialValues = {
    name: '',
    bindableService: {},
  };
  return (
    <Formik
      initialValues={initialValues}
      initialStatus={{ error: '' }}
      validationSchema={serviceBindingValidationSchema}
      onSubmit={handleSubmit}
    >
      {(formikProps) => <CreateServiceBindingForm {...formikProps} {...props} />}
    </Formik>
  );
};

export const createServiceBindingModal = createModalLauncher(CreateServiceBindingModal);
