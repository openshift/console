import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { RouteModel } from '@console/internal/models';
import { K8sResourceKind, RouteKind } from '@console/internal/module/k8s';
import {
  FlexForm,
  FormBody,
  FormFooter,
  SyncedEditorField,
  CodeEditorField,
} from '@console/shared/src';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { CreateRoute } from './create-route';
import { convertEditFormToRoute, convertRouteToEditForm } from './utils';
import { PageHeading } from '../utils';

type RouteFormProps = {
  handleCancel: () => void;
  heading: string;
  submitLabel: string;
  services: K8sResourceKind[];
  existingRoute?: RouteKind;
};

export const RouteForm: React.FC<FormikProps<FormikValues> & RouteFormProps> = ({
  dirty,
  errors,
  existingRoute,
  handleCancel,
  handleSubmit,
  heading,
  isSubmitting,
  services,
  setStatus,
  status,
  submitLabel,
  validateForm,
  values,
}) => {
  const { t } = useTranslation();
  const { editorType, formData } = values;
  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'console.routeForm.editor.lastView';

  const formEditor = <CreateRoute services={services} existingRoute={existingRoute} />;

  const yamlEditor = (
    <CodeEditorField name="yamlData" model={RouteModel} onSave={handleSubmit} showSamples />
  );

  const sanitizeToForm = (yamlData: RouteKind) => {
    return convertRouteToEditForm(services, yamlData);
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(convertEditFormToRoute(formData, existingRoute), 'yamlData', {
      skipInvalid: true,
    });

  React.useEffect(() => {
    setStatus({ submitError: null });
    if (values.editorType === EditorType.Form) {
      setTimeout(() => validateForm(), 0);
    }
  }, [setStatus, values.editorType, validateForm]);

  return (
    <>
      <PageHeading
        title={heading}
        helpText={t('public~Routing is a way to make your application publicly visible.')}
      />
      <FlexForm onSubmit={handleSubmit}>
        <FormBody flexLayout className="co-m-pane__body--no-top-margin">
          <SyncedEditorField
            name="editorType"
            formContext={{
              name: 'formData',
              editor: formEditor,
              sanitizeTo: sanitizeToForm,
            }}
            yamlContext={{
              name: 'yamlData',
              editor: yamlEditor,
              sanitizeTo: sanitizeToYaml,
            }}
            lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
            noMargin
          />
        </FormBody>
        <FormFooter
          handleCancel={handleCancel}
          errorMessage={status?.submitError}
          successMessage={status?.submitSuccess}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          disableSubmit={
            (editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)) || isSubmitting
          }
          sticky
        />
      </FlexForm>
    </>
  );
};
