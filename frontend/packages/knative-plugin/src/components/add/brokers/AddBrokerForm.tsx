import * as React from 'react';
import { Alert, AlertActionCloseButton, Grid, GridItem } from '@patternfly/react-core';
import { FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { useAccessReview } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  FlexForm,
  FormBody,
  SyncedEditorField,
  FormFooter,
  YAMLEditorField,
  UNASSIGNED_APPLICATIONS_KEY,
} from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { EventingBrokerModel } from '../../../models';
import { LABEL_PART_OF } from '../const';
import { AddBrokerFormYamlValues } from '../import-types';
import { convertFormToBrokerYaml } from './add-broker-utils';

interface AddBrokerFormProps {
  namespace: string;
}

const AddBrokerForm: React.FC<FormikProps<AddBrokerFormYamlValues> & AddBrokerFormProps> = (
  formikProps,
) => {
  const { t } = useTranslation();
  const {
    values,
    errors,
    dirty,
    status,
    namespace,
    handleReset,
    handleSubmit,
    isSubmitting,
    setFieldValue,
  } = formikProps;

  const canCreateBroker = useAccessReview({
    group: EventingBrokerModel.apiGroup,
    resource: EventingBrokerModel.plural,
    namespace,
    verb: 'create',
  });

  const convertYamlToForm = (yamlBroker: K8sResourceKind) => {
    const appGroupName = yamlBroker.metadata?.labels?.[LABEL_PART_OF];
    const newFormData = {
      name: yamlBroker.metadata?.name || '',
      project: {
        name: yamlBroker.metadata?.namespace || namespace,
      },
      application: {
        ...values.formData.application,
        ...(appGroupName && { name: appGroupName, selectedKey: appGroupName }),
        ...(appGroupName &&
          appGroupName !== values.formData.application.name &&
          appGroupName !== values.formData.application.initial && {
            name: appGroupName,
            selectedKey: values.formData.application.selectedKey ? CREATE_APPLICATION_KEY : '',
          }),
        ...(!appGroupName && {
          name: '',
          selectedKey: UNASSIGNED_APPLICATIONS_KEY,
        }),
      },
      spec: yamlBroker.spec,
    };
    return newFormData;
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(convertFormToBrokerYaml(values), 'yamlData', {
      skipInvalid: true,
    });

  const FormEditor = (
    <>
      {values.showCanUseYAMLMessage && (
        <Grid hasGutter>
          <GridItem span={6}>
            <Alert
              actionClose={
                <AlertActionCloseButton
                  onClose={() => setFieldValue('showCanUseYAMLMessage', false)}
                />
              }
              isInline
              title={t(
                'knative-plugin~Note: Some fields may not be represented in this form view. Please select "YAML view" for full control.',
              )}
              variant="info"
            />
          </GridItem>
        </Grid>
      )}
      <AppSection
        project={values.formData.project}
        noProjectsAvailable={false}
        extraMargin
        subPath="formData"
        fullWidth={false}
      />
    </>
  );
  const yamlEditor = (
    <YAMLEditorField name="yamlData" model={EventingBrokerModel} onSave={handleSubmit} />
  );
  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        {canCreateBroker ? (
          <SyncedEditorField
            name="editorType"
            formContext={{
              name: 'formData',
              editor: FormEditor,
              sanitizeTo: convertYamlToForm,
            }}
            yamlContext={{
              name: 'yamlData',
              editor: yamlEditor,
              sanitizeTo: sanitizeToYaml,
            }}
          />
        ) : (
          <Alert variant="default" title={t('knative-plugin~Broker cannot be created')} isInline>
            {t('knative-plugin~You do not have write access in this project.')}
          </Alert>
        )}
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

export default AddBrokerForm;
