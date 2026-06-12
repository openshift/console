import type { ReactNode, FC } from 'react';
import { Alert, AlertActionCloseButton, Grid, GridItem } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { FlexForm } from '@console/shared/src/components/form-utils/FlexForm';
import { FormBody } from '@console/shared/src/components/form-utils/FormBody';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import { CodeEditorField } from '@console/shared/src/components/formik-fields/CodeEditorField';
import { SyncedEditorField } from '@console/shared/src/components/formik-fields/SyncedEditorField';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import {
  getCatalogEventSinkResource,
  sanitizeSinkToForm,
} from '../../utils/create-eventsink-utils';
import EventSinkSection from './event-sinks/EventSinkSection';
import type { EventSinkSyncFormData } from './import-types';

interface OwnProps {
  namespace: string;
  eventSinkMetaDescription: ReactNode;
  kameletSink: K8sResourceKind;
}

const EventSinkForm: FC<FormikProps<FormikValues> & OwnProps> = ({
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
  const { t } = useTranslation('knative-plugin');
  const LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY = 'knative.eventSinkForm.editor.lastView';
  const yamlEditor = <CodeEditorField name="yamlData" showSamples onSave={handleSubmit} />;

  const sanitizeToYaml = () =>
    safeJSToYAML(getCatalogEventSinkResource(values as EventSinkSyncFormData), 'yamlData', {
      skipInvalid: true,
      noRefs: true,
    });

  const formEditor = (
    <Grid hasGutter>
      <GridItem md={4} lg={5} order={{ default: '0', md: '1' }}>
        {eventSinkMetaDescription}
      </GridItem>
      <GridItem md={8} lg={7} order={{ default: '1', md: '0' }}>
        {values.showCanUseYAMLMessage && (
          <Alert
            actionClose={
              <AlertActionCloseButton
                onClose={() => setFieldValue('showCanUseYAMLMessage', false)}
              />
            }
            isInline
            title={t(
              'knative-plugin~Some fields might not be displayed in this form view. Select "YAML view" to edit all fields.',
            )}
            variant="info"
          />
        )}
        <EventSinkSection namespace={namespace} kameletSink={kameletSink} fullWidth />
      </GridItem>
    </Grid>
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
          lastViewUserPreferenceKey={LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY}
        />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('Create')}
        disableSubmit={
          (values.editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)) ||
          isSubmitting
        }
        resetLabel={t('Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default EventSinkForm;
