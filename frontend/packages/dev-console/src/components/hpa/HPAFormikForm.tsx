import * as React from 'react';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import {
  HorizontalPodAutoscalerKind,
  k8sCreate,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { history } from '@console/internal/components/utils';
import HPAForm from './HPAForm';
import {
  getFormData,
  getInvalidUsageError,
  getYAMLData,
  isCpuUtilizationPossible,
  isMemoryUtilizationPossible,
  sanityForSubmit,
} from './hpa-utils';
import { HPAFormValues } from './types';
import { hpaValidationSchema } from './validation-utils';

type HPAFormikFormProps = {
  targetResource: K8sResourceKind;
};

const HPAFormikForm: React.FC<HPAFormikFormProps> = ({ targetResource }) => {
  const initialValues: HPAFormValues = {
    showCanUseYAMLMessage: true,
    disabledFields: {
      cpuUtilization: !isCpuUtilizationPossible(targetResource),
      memoryUtilization: !isMemoryUtilizationPossible(targetResource),
    },
    editorType: EditorType.Form,
    formData: getFormData(targetResource),
    yamlData: getYAMLData(targetResource),
  };

  const handleSubmit = (values: HPAFormValues, helpers: FormikHelpers<HPAFormValues>) => {
    const hpa: HorizontalPodAutoscalerKind = sanityForSubmit(
      targetResource,
      values.editorType === EditorType.YAML ? safeYAMLToJS(values.yamlData) : values.formData,
    );

    const invalidUsageError = getInvalidUsageError(hpa, values);
    if (invalidUsageError) {
      helpers.setStatus({ submitError: invalidUsageError });
      return;
    }

    helpers.setSubmitting(true);
    k8sCreate(HorizontalPodAutoscalerModel, hpa)
      .then(() => {
        helpers.setSubmitting(false);
        history.goBack();
      })
      .catch((error) => {
        helpers.setSubmitting(false);
        helpers.setStatus({ submitError: error?.message || 'Unknown error submitting' });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={hpaValidationSchema}
    >
      {(props: FormikProps<HPAFormValues>) => (
        <HPAForm {...props} targetResource={targetResource} />
      )}
    </Formik>
  );
};

export default HPAFormikForm;
