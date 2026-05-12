import type { ReactNode, FC } from 'react';
import { useMemo } from 'react';
import { TextInputTypes, Grid, GridItem, Button, Alert } from '@patternfly/react-core';
import type { FormikProps } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { ResourceDropdownField } from '@console/shared/src/components/formik-fields/ResourceDropdownField';
import { getJSONSchemaOrder, prune } from '@console/shared/src/components/dynamic-form/utils';
import { FlexForm } from '@console/shared/src/components/form-utils/FlexForm';
import { FormBody } from '@console/shared/src/components/form-utils/FormBody';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import { FormHeader } from '@console/shared/src/components/form-utils/FormHeader';
import { CodeEditorField } from '@console/shared/src/components/formik-fields/CodeEditorField';
import { DynamicFormField } from '@console/shared/src/components/formik-fields/DynamicFormField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { SyncedEditorField } from '@console/shared/src/components/formik-fields/SyncedEditorField';
import { useHelmReadmeModalLauncher } from '../install-upgrade/HelmReadmeModal';
import type { HelmURLInstallFormData } from './types';
import { useSecretResources } from './useSecretResources';

export interface HelmURLInstallFormProps {
  chartHasValues: boolean;
  chartMetaDescription: ReactNode;
  chartError: Error | null;
  namespace: string;
  onBack: () => void;
}

const HelmURLInstallForm: FC<FormikProps<HelmURLInstallFormData> & HelmURLInstallFormProps> = ({
  chartHasValues,
  errors,
  handleSubmit,
  status,
  isSubmitting,
  values,
  chartMetaDescription,
  chartError,
  namespace,
  onBack,
}) => {
  const { t } = useTranslation();
  const { chartReadme, formData, formSchema } = values;

  const autocompleteFilter = (strText: string, item: string): boolean => fuzzy(strText, item);

  const secretResources = useSecretResources(namespace);

  const helmReadmeModalLauncher = useHelmReadmeModalLauncher({
    readme: chartReadme,
  });

  const isSubmitDisabled = isSubmitting || !_.isEmpty(errors) || !!chartError;

  const uiSchema = useMemo(() => (formSchema ? getJSONSchemaOrder(formSchema, {}) : {}), [
    formSchema,
  ]);
  const LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY = 'helm.urlInstallForm.editor.lastView';

  const formEditor = formData && formSchema && (
    <DynamicFormField
      name="formData"
      schema={formSchema}
      uiSchema={uiSchema}
      formDescription={chartMetaDescription}
    />
  );

  const yamlEditor = chartHasValues && (
    <CodeEditorField
      name="yamlData"
      label={t('helm-plugin~Helm release')}
      schema={formSchema}
      showSamples={false}
      onSave={handleSubmit}
    />
  );

  const readmeText = chartReadme && (
    <Trans t={t} ns="helm-plugin">
      For more information on the chart, refer to this{' '}
      <Button
        type="button"
        variant="link"
        data-test-id="helm-readme-modal"
        onClick={helmReadmeModalLauncher}
        isInline
      >
        README
      </Button>
    </Trans>
  );

  const formHelpText = (
    <>
      {chartHasValues && (
        <>
          {t(
            'helm-plugin~Complete the form to create a Helm release. The Helm chart authors might have provided some default values.',
          )}{' '}
          &nbsp;
        </>
      )}
      {readmeText}
    </>
  );

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <FormHeader
          title={t('helm-plugin~Configure Helm release')}
          helpText={formHelpText}
          marginBottom="lg"
        />
        {chartError && (
          <Alert variant="danger" isInline title={t('helm-plugin~Helm Chart cannot be installed')}>
            {t('helm-plugin~The Helm Chart is currently unavailable. {{chartError}}', {
              chartError: chartError.message,
            })}
          </Alert>
        )}
        <FormSection fullWidth>
          <Grid hasGutter>
            <GridItem xl={5} lg={5} md={12}>
              <InputField
                type={TextInputTypes.text}
                name="chartURL"
                label={t('helm-plugin~Chart URL')}
                isDisabled
                data-test="chart-url"
              />
            </GridItem>
            <GridItem xl={4} lg={4} md={12}>
              <InputField
                type={TextInputTypes.text}
                name="releaseName"
                label={t('helm-plugin~Release name')}
                isDisabled
                data-test="release-name"
              />
            </GridItem>
            <GridItem xl={3} lg={3} md={12}>
              <InputField
                type={TextInputTypes.text}
                name="chartVersion"
                label={t('helm-plugin~Version')}
                isDisabled
                data-test="chart-version"
              />
            </GridItem>
            <GridItem xl={3} lg={3} md={12}>
              <ResourceDropdownField
                name="basicAuthSecretName"
                label={t('helm-plugin~Secret for basic authentication')}
                resources={secretResources}
                dataSelector={['metadata', 'name']}
                fullWidth
                placeholder={t('helm-plugin~Select a secret')}
                showBadge
                autocompleteFilter={autocompleteFilter}
                disabled
                helpText={t(
                  'helm-plugin~A secret with "username" and "password" keys for OCI/HTTP(S) authentication',
                )}
              />
            </GridItem>
          </Grid>
        </FormSection>
        {!chartError &&
          (!formSchema && !chartHasValues ? (
            <Alert
              variant="info"
              title={t(
                "helm-plugin~Helm release is not configurable since the Helm Chart doesn't define any values.",
              )}
              isInline
            />
          ) : (
            <SyncedEditorField
              name="editorType"
              formContext={{ name: 'formData', editor: formEditor, isDisabled: !formSchema }}
              yamlContext={{ name: 'yamlData', editor: yamlEditor }}
              lastViewUserPreferenceKey={LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY}
              prune={prune}
              noMargin
            />
          ))}
      </FormBody>
      <FormFooter
        handleReset={onBack}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('helm-plugin~Install')}
        disableSubmit={isSubmitDisabled}
        resetLabel={t('helm-plugin~Back')}
        sticky
      />
    </FlexForm>
  );
};

export default HelmURLInstallForm;
