import * as React from 'react';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import {
  HorizontalPodAutoscalerKind,
  k8sCreate,
  K8sResourceKind,
  k8sUpdate,
} from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import {
  getFormData,
  getInvalidUsageError,
  getYAMLData,
  hasCustomMetrics,
  isCpuUtilizationPossible,
  isMemoryUtilizationPossible,
  sanityForSubmit,
} from './hpa-utils';
import HPAForm from './HPAForm';
import { HPAFormValues } from './types';
import { hpaValidationSchema } from './validation-utils';

type HPAFormikFormProps = {
  existingHPA?: HorizontalPodAutoscalerKind;
  targetResource: K8sResourceKind;
};

const HPAFormikForm: React.FC<HPAFormikFormProps> = ({ existingHPA, targetResource }) => {
  const { t } = useTranslation();
  const initialValues: HPAFormValues = {
    showCanUseYAMLMessage: true,
    disabledFields: {
      name: !!existingHPA,
      cpuUtilization: !isCpuUtilizationPossible(targetResource),
      memoryUtilization: !isMemoryUtilizationPossible(targetResource),
    },
    editorType: hasCustomMetrics(existingHPA) ? EditorType.YAML : EditorType.Form,
    formData: getFormData(targetResource, existingHPA),
    yamlData: getYAMLData(targetResource, existingHPA),
  };

  const handleSubmit = (values: HPAFormValues, helpers: FormikHelpers<HPAFormValues>) => {
    const hpa: HorizontalPodAutoscalerKind = sanityForSubmit(
      targetResource,
      values.editorType === EditorType.YAML ? safeYAMLToJS(values.yamlData) : values.formData,
    );

    const invalidUsageError = getInvalidUsageError(hpa, values);
    if (invalidUsageError) {
      helpers.setStatus({ submitError: invalidUsageError });
      return Promise.reject();
    }

    const method = existingHPA ? k8sUpdate : k8sCreate;

    return method(HorizontalPodAutoscalerModel, hpa)
      .then(() => {
        history.goBack();
      })
      .catch((error) => {
        helpers.setStatus({
          submitError: error?.message || t('devconsole~Unknown error submitting'),
        });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={hpaValidationSchema(t)}
    >
      {(props: FormikProps<HPAFormValues>) => (
        <HPAForm {...props} targetResource={targetResource} />
      )}
    </Formik>
  );
};

export default HPAFormikForm;
