import * as React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
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
import {
  getCatalogEventSinkResource,
  sanitizeSinkToForm,
} from '../../utils/create-eventsink-utils';
import EventSinkSection from './event-sinks/EventSinkSection';
import { EventSinkSyncFormData } from './import-types';

interface OwnProps {
  namespace: string;
  eventSinkMetaDescription: React.ReactNode;
  kameletSink: K8sResourceKind;
}

const EventSinkForm: React.FC<FormikProps<FormikValues> & OwnProps> = ({
  errors,
  values,
  handleSubmit,
  handleReset,
  setFieldValue,
  status,
  isSubmitting,
  dirty,
  namespace,
  eventSinkMetaDescription,
  kameletSink,
}) => {
  const { t } = useTranslation();
  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'knative.eventSinkForm.editor.lastView';
  const yamlEditor = <YAMLEditorField name="yamlData" showSamples onSave={handleSubmit} />;

  const sanitizeToYaml = () =>
    safeJSToYAML(getCatalogEventSinkResource(values as EventSinkSyncFormData), 'yamlData', {
      skipInvalid: true,
      noRefs: true,
    });

  const formEditor = (
    <div className="row">
      <div className="col-sm-12 col-md-4 col-md-push-8 col-lg-5 col-lg-push-7">
        {eventSinkMetaDescription}
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
        <EventSinkSection namespace={namespace} kameletSink={kameletSink} fullWidth />
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
              sanitizeSinkToForm(newFormData, values.formData, kameletSink),
          }}
          yamlContext={{ name: 'yamlData', editor: yamlEditor, sanitizeTo: sanitizeToYaml }}
          lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
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

export default EventSinkForm;
