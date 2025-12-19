import type { ReactNode, FC } from 'react';
import { Alert, AlertActionCloseButton, Grid, GridItem } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  FormFooter,
  SyncedEditorField,
  CodeEditorField,
  FlexForm,
  FormBody,
} from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import {
  getCatalogEventSourceResource,
  sanitizeSourceToForm,
} from '../../utils/create-eventsources-utils';
import EventSourceSection from './event-sources/EventSourceSection';
import { EventSourceSyncFormData } from './import-types';

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
  const { t } = useTranslation();
  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'knative.eventSourceForm.editor.lastView';
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
              'knative-plugin~Note: Some fields may not be represented in this form view. Please select "YAML view" for full control of object creation.',
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

export default EventSourceForm;
