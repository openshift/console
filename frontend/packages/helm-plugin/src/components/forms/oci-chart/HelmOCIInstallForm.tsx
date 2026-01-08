import type { ReactNode, FC } from 'react';
import { useContext, useMemo } from 'react';
import { TextInputTypes, Grid, GridItem, Button, Alert } from '@patternfly/react-core';
import { FormikProps } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { ThemeContext } from '@console/internal/components/ThemeProvider';
import {
  InputField,
  FormFooter,
  FormBody,
  CodeEditorField,
  DynamicFormField,
  SyncedEditorField,
  FormHeader,
  FlexForm,
} from '@console/shared';
import { getJSONSchemaOrder, prune } from '@console/shared/src/components/dynamic-form/utils';
import { useHelmReadmeModalLauncher } from '../install-upgrade/HelmReadmeModal';
import { HelmOCIInstallFormData } from './types';

export interface HelmOCIInstallFormProps {
  chartHasValues: boolean;
  chartMetaDescription: ReactNode;
  chartError: Error | null;
  namespace: string;
  onBack: () => void;
}

const HelmOCIInstallForm: FC<FormikProps<HelmOCIInstallFormData> & HelmOCIInstallFormProps> = ({
  chartHasValues,
  errors,
  handleSubmit,
  status,
  isSubmitting,
  values,
  chartMetaDescription,
  chartError,
  onBack,
}) => {
  const { t } = useTranslation();
  const theme = useContext(ThemeContext);
  const { chartReadme, formData, formSchema } = values;

  const helmReadmeModalLauncher = useHelmReadmeModalLauncher({
    readme: chartReadme,
    theme,
  });

  const isSubmitDisabled = isSubmitting || !_.isEmpty(errors) || !!chartError;

  const uiSchema = useMemo(() => getJSONSchemaOrder(formSchema, {}), [formSchema]);

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'helm.ociInstallForm.editor.lastView';

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
      label={t('helm-plugin~Helm Release')}
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
            'helm-plugin~The Helm Release can be created by completing the form. Default values may be provided by the Helm chart authors.',
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
          title={t('helm-plugin~Configure Helm Release')}
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
              lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
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

export default HelmOCIInstallForm;
