import type { FC } from 'react';
import { useCallback } from 'react';
import type { FormikHelpers, FormikProps } from 'formik';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import type {
  HorizontalPodAutoscalerKind,
  K8sKind,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { getFormData, getYAMLData, hasCustomMetrics, sanityForSubmit } from './hpa-utils';
import HPAForm from './HPAForm';
import type { HPAFormValues } from './types';
import { hpaValidationSchema } from './validation-utils';

type HPAFormikFormProps = {
  existingHPA?: HorizontalPodAutoscalerKind;
  targetResource: K8sResourceKind;
};

const HPAFormikForm: FC<HPAFormikFormProps> = ({ existingHPA, targetResource }) => {
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const { t } = useTranslation();
  const initialValues: HPAFormValues = {
    showCanUseYAMLMessage: true,
    disabledFields: {
      name: !!existingHPA,
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

    const method: (
      kind: K8sKind,
      data: HorizontalPodAutoscalerKind,
    ) => Promise<HorizontalPodAutoscalerKind> = existingHPA ? k8sUpdate : k8sCreate;
    return method(HorizontalPodAutoscalerModel, hpa)
      .then(() => {
        navigate(-1);
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
      onReset={handleCancel}
      validationSchema={hpaValidationSchema(t)}
    >
      {(props: FormikProps<HPAFormValues>) => (
        <HPAForm {...props} existingHPA={existingHPA} targetResource={targetResource} />
      )}
    </Formik>
  );
};

export default HPAFormikForm;
