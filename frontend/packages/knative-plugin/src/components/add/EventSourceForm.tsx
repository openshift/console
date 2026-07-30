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
  getCatalogEventSourceResource,
  sanitizeSourceToForm,
} from '../../utils/create-eventsources-utils';
import EventSourceSection from './event-sources/EventSourceSection';
import type { EventSourceSyncFormData } from './import-types';

interface OwnProps {
  namespace: string;
  eventSourceMetaDescription: ReactNode;
  kameletSource?: K8sResourceKind;
}

const EventSourceForm: FC<FormikProps<FormikValues> & OwnProps> = ({
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
  const { t } = useTranslation('knative-plugin');
  const LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY = 'knative.eventSourceForm.editor.lastView';
  const yamlEditor = <CodeEditorField name="yamlData" showSamples onSave={handleSubmit} />;

  const sanitizeToYaml = () =>
    safeJSToYAML(getCatalogEventSourceResource(values as EventSourceSyncFormData), 'yamlData', {
      skipInvalid: true,
      noRefs: true,
    });

  const formEditor = (
    <Grid hasGutter>
      <GridItem md={4} lg={5} order={{ default: '0', md: '1' }}>
        {eventSourceMetaDescription}
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
              'Some fields might not be displayed in this form view. Select "YAML view" to edit all fields.',
            )}
            variant="info"
          />
        )}
        <EventSourceSection namespace={namespace} kameletSource={kameletSource} fullWidth />{' '}
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
              sanitizeSourceToForm(newFormData, values.formData, kameletSource),
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

export default EventSourceForm;
