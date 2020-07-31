import * as React from 'react';
import { isEmpty } from 'lodash';
import { FormikProps } from 'formik';
import { FlexForm, FormFooter, SyncedEditorField, YAMLEditorField } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { HorizontalPodAutoscalerKind, K8sResourceCommon } from '@console/internal/module/k8s';
import HPADetailsForm from './HPADetailsForm';
import { sanitizeHPAToForm } from './hpa-utils';
import { HPAFormValues } from './types';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';

type HPAFormProps = {
  targetResource: K8sResourceCommon;
};

const HPAForm: React.FC<FormikProps<HPAFormValues> & HPAFormProps> = ({
  errors,
  handleReset,
  handleSubmit,
  status,
  setStatus,
  isSubmitting,
  targetResource,
  validateForm,
  values,
}) => {
  const isForm = values.editorType === EditorType.Form;
  const formEditor = <HPADetailsForm />;
  const yamlEditor = (
    <YAMLEditorField
      name="yamlData"
      onSave={handleSubmit}
      schemaModel={HorizontalPodAutoscalerModel}
    />
  );
  const customMetrics = false;

  React.useEffect(() => {
    setStatus({ submitError: null });
    if (values.editorType === EditorType.Form) {
      // Force validation against the new data that was adjusted in the YAML
      // Formik isn't properly handling the immediate state of the form values during the cycle of the editorType
      setTimeout(() => validateForm(), 0);
    }
  }, [setStatus, values.editorType, validateForm]);

  return (
    <FlexForm onSubmit={handleSubmit}>
      <SyncedEditorField
        name="editorType"
        formContext={{
          name: 'formData',
          editor: formEditor,
          isDisabled: customMetrics,
          sanitizeTo: (newFormData: Partial<HorizontalPodAutoscalerKind>) =>
            sanitizeHPAToForm(newFormData, targetResource),
        }}
        yamlContext={{ name: 'yamlData', editor: yamlEditor }}
      />
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel="Save"
        disableSubmit={isForm && !isEmpty(errors)}
        resetLabel="Cancel"
        sticky
      />
    </FlexForm>
  );
};

export default HPAForm;
