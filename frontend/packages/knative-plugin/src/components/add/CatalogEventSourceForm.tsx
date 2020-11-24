import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FormFooter, SyncedEditorField, YAMLEditorField, FlexForm } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import EventSourceSection from './event-sources/EventSourceSection';
import {
  EventSourceListData,
  SinkType,
  EventSourceSyncFormData,
  EventSources,
} from './import-types';
import {
  getCatalogEventSourceResource,
  sanitizeKafkaSourceResource,
} from '../../utils/create-eventsources-utils';
import { isDynamicEventSourceKind } from '../../utils/fetch-dynamic-eventsources-utils';

interface OwnProps {
  namespace: string;
  eventSourceStatus: EventSourceListData | null;
  eventSourceMetaDescription: React.ReactNode;
}

const CatalogEventSourceForm: React.FC<FormikProps<FormikValues> & OwnProps> = ({
  errors,
  values,
  handleSubmit,
  handleReset,
  setFieldValue,
  status,
  isSubmitting,
  dirty,
  namespace,
  eventSourceStatus,
  eventSourceMetaDescription,
}) => {
  const { t } = useTranslation();
  const yamlEditor = <YAMLEditorField name="yamlData" onSave={handleSubmit} />;

  const sanitizeToForm = (newFormData: K8sResourceKind) => {
    const specData = newFormData.spec;
    const appGroupName = newFormData.metadata?.labels?.['app.kubernetes.io/part-of'];
    const formData = {
      ...values.formData,
      application: {
        ...values.formData.application,
        ...(appGroupName &&
          appGroupName !== values.formData.application.name && {
            name: appGroupName,
            selectedKey: values.formData.application.selectedKey ? CREATE_APPLICATION_KEY : '',
          }),
        ...(appGroupName === undefined && {
          name: 'no application group',
          selectedKey: '#UNASSIGNED_APP#',
        }),
      },
      name: newFormData.metadata?.name,
      sinkType: specData?.sink?.ref ? SinkType.Resource : SinkType.Uri,
      sink: {
        apiVersion: specData?.sink?.ref?.apiVersion,
        kind: specData?.sink?.ref?.kind,
        name: specData?.sink?.ref?.name,
        key: `${specData?.sink?.ref?.kind}-${specData?.sink?.ref?.name}`,
        uri: specData?.sink?.uri || '',
      },
      data: {
        [values.formData.type]: {
          ..._.omit(specData, 'sink'),
        },
      },
    };
    return values.formData.type === EventSources.KafkaSource
      ? sanitizeKafkaSourceResource(formData)
      : formData;
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(getCatalogEventSourceResource(values as EventSourceSyncFormData), 'yamlData', {
      skipInvalid: true,
      noRefs: true,
    });

  const formEditor = (
    <>
      {eventSourceStatus && !_.isEmpty(eventSourceStatus.eventSourceList) && (
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
            <EventSourceSection namespace={namespace} catalogFlow fullWidth />{' '}
          </div>
        </div>
      )}
    </>
  );
  return (
    <FlexForm onSubmit={handleSubmit}>
      {isDynamicEventSourceKind(values.formData.type) && (
        <SyncedEditorField
          name="editorType"
          formContext={{
            name: 'formData',
            editor: formEditor,
            sanitizeTo: sanitizeToForm,
          }}
          yamlContext={{ name: 'yamlData', editor: yamlEditor, sanitizeTo: sanitizeToYaml }}
        />
      )}
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('knative-plugin~Create')}
        disableSubmit={
          values.editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)
        }
        resetLabel={t('knative-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default CatalogEventSourceForm;
