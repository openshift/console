import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { Perspective } from '@console/dynamic-plugin-sdk';
import { createModalLauncher } from '@console/internal/components/factory/modal';
import { getQueryArgument } from '@console/internal/components/utils';
import {
  K8sKind,
  k8sList,
  K8sResourceKind,
  referenceFor,
  modelFor,
} from '@console/internal/module/k8s';
import { ServiceBindingModel } from '@console/service-binding-plugin/src/models';
import { usePerspectives } from '@console/shared/src';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { createServiceBinding } from '@console/topology/src/operators/actions/serviceBindings';
import { useValuesForPerspectiveContext } from '../../detect-perspective/useValuesForPerspectiveContext';
import CreateServiceBindingForm, {
  CreateServiceBindingFormProps,
} from './CreateServiceBindingForm';
import { checkExistingServiceBinding } from './service-binding-modal-launcher-utils';
import { serviceBindingValidationSchema } from './servicebinding-validation-utils';

type CreateServiceBindingModalProps = CreateServiceBindingFormProps & {
  model: K8sKind;
  source: K8sResourceKind;
  target?: K8sResourceKind;
  close?: () => void;
};

type CreateServiceBindingFormType = {
  name: string;
  bindableService: K8sResourceKind;
};

const handleRedirect = async (
  project: string,
  perspective: string,
  perspectiveExtensions: Perspective[],
  navigate: NavigateFunction,
) => {
  const perspectiveData = perspectiveExtensions.find((item) => item.properties.id === perspective);
  const redirectURL = (await perspectiveData.properties.importRedirectURL())(project);
  navigate(redirectURL);
};

const CreateServiceBindingModal: React.FC<CreateServiceBindingModalProps> = (props) => {
  const { source, model } = props;
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [activePerspective] = useValuesForPerspectiveContext();
  const perspectiveExtensions = usePerspectives();
  const navigate = useNavigate();
  const handleSubmit = async (values, actions) => {
    const bindings: K8sResourceKind[] = await k8sList(ServiceBindingModel, {
      ns: source.metadata.namespace,
    });
    let existingServiceBinding = {};
    if (bindings.length > 0) {
      existingServiceBinding = checkExistingServiceBinding(
        bindings,
        source,
        values.bindableService,
        model,
      );
    }
    if (Object.keys(existingServiceBinding ?? {}).length === 0) {
      try {
        await createServiceBinding(source, values.bindableService, values.name);
        props.close();
        fireTelemetryEvent('Service Binding Created');
        getQueryArgument('view') === null &&
          handleRedirect(
            source.metadata.namespace,
            activePerspective,
            perspectiveExtensions,
            navigate,
          );
      } catch (errorMessage) {
        actions.setStatus({ submitError: errorMessage.message });
      }
    } else {
      actions.setStatus({
        submitError: t(
          'console-app~Service binding already exists. Select a different service to connect to.',
        ),
      });
    }
  };

  const initialValues: CreateServiceBindingFormType = {
    name: props.target
      ? `${source.metadata.name}-${model.abbr.toLowerCase()}-${
          props.target.metadata.name
        }-${modelFor(referenceFor(props.target)).abbr.toLowerCase()}`
      : '',
    bindableService: props.target ? props.target : {},
  };
  return (
    <Formik
      initialValues={initialValues}
      initialStatus={{ error: '' }}
      validationSchema={serviceBindingValidationSchema(t)}
      onSubmit={handleSubmit}
    >
      {(formikProps) => <CreateServiceBindingForm {...formikProps} {...props} />}
    </Formik>
  );
};

export const createServiceBindingModal = createModalLauncher(CreateServiceBindingModal);
