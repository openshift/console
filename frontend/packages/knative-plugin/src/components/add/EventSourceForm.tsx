import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  FormFooter,
  SyncedEditorField,
  YAMLEditorField,
  FlexForm,
  FormBody,
} from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import EventSourceSection from './event-sources/EventSourceSection';
import { EventSourceSyncFormData } from './import-types';
import {
  getCatalogEventSourceResource,
  sanitizeSourceToForm,
} from '../../utils/create-eventsources-utils';

interface OwnProps {
  namespace: string;
  eventSourceMetaDescription: React.ReactNode;
  kameletSource?: K8sResourceKind;
}

const EventSourceForm: React.FC<FormikProps<FormikValues> & OwnProps> = ({
  errors,
  values,
  handleSubmit,
  handleReset,
  setFieldValue,
  status,
  isSubmitting,
  dirty,
  namespace,
  eventSourceMetaDescription,
  kameletSource,
}) => {
  const { t } = useTranslation();
  const yamlEditor = <YAMLEditorField name="yamlData" onSave={handleSubmit} />;

  const sanitizeToYaml = () =>
    safeJSToYAML(getCatalogEventSourceResource(values as EventSourceSyncFormData), 'yamlData', {
      skipInvalid: true,
      noRefs: true,
    });

  const formEditor = (
    <div className="row">
      <div className="col-sm-12 col-md-4 col-md-push-8 col-lg-5 col-lg-push-7">
        {eventSourceMetaDescription}
      </div>
      <div className="col-sm-12 col-md-8 col-md-pull-4 col-lg-7 col-lg-pull-5">
        {values.showCanUseYAMLMessage && (
          <Alert
            actionClose={
              <AlertActionCloseButton
                onClose={() => setFieldValue('showCanUseYAMLMessage', false)}
              />
            }
            isInline
            title={t(
              'knative-plugin~Note: Some fields may not be represented in this form view. Please select "YAML view" for full control of object creation.',
            )}
            variant="info"
          />
        )}
        <EventSourceSection namespace={namespace} kameletSource={kameletSource} fullWidth />{' '}
      </div>
    </div>
  );
  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <SyncedEditorField
          name="editorType"
          formContext={{
            name: 'formData',
            editor: formEditor,
            sanitizeTo: (newFormData: K8sResourceKind) =>
              sanitizeSourceToForm(newFormData, values.formData, kameletSource),
          }}
          yamlContext={{ name: 'yamlData', editor: yamlEditor, sanitizeTo: sanitizeToYaml }}
        />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('knative-plugin~Create')}
        disableSubmit={
          (values.editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)) ||
          isSubmitting
        }
        resetLabel={t('knative-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default EventSourceForm;
