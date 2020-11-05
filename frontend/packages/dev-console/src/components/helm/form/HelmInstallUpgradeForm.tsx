import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { TextInputTypes, Grid, GridItem, Button, Alert } from '@patternfly/react-core';
import {
  InputField,
  FormFooter,
  FlexForm,
  YAMLEditorField,
  DynamicFormField,
  SyncedEditorField,
  FormHeader,
} from '@console/shared';
import { getJSONSchemaOrder } from '@console/shared/src/components/dynamic-form/utils';
import FormSection from '../../import/section/FormSection';
import { helmReadmeModalLauncher } from '../HelmReadmeModal';
import { HelmActionType, HelmChart, HelmActionConfigType } from '../helm-types';
import HelmChartVersionDropdown from './HelmChartVersionDropdown';

export interface HelmInstallUpgradeFormProps {
  chartHasValues: boolean;
  helmActionConfig: HelmActionConfigType;
  chartMetaDescription: React.ReactNode;
  onVersionChange: (chart: HelmChart) => void;
  chartError: Error;
}

const HelmInstallUpgradeForm: React.FC<FormikProps<FormikValues> & HelmInstallUpgradeFormProps> = ({
  chartHasValues,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  helmActionConfig,
  values,
  dirty,
  chartMetaDescription,
  onVersionChange,
  chartError,
}) => {
  const { t } = useTranslation();
  const { chartName, chartVersion, chartReadme, formData, formSchema, editorType } = values;
  const { type: helmAction, title, subTitle } = helmActionConfig;

  const isSubmitDisabled =
    (helmAction === HelmActionType.Upgrade && !dirty) ||
    status?.isSubmitting ||
    !_.isEmpty(errors) ||
    !!chartError;

  const uiSchema = React.useMemo(() => getJSONSchemaOrder(formSchema, {}), [formSchema]);

  const formEditor = formData && formSchema && (
    <DynamicFormField
      name="formData"
      schema={formSchema}
      uiSchema={uiSchema}
      formDescription={chartMetaDescription}
    />
  );

  const yamlEditor = chartHasValues && <YAMLEditorField name="yamlData" onSave={handleSubmit} />;

  const formSubTitle = _.isString(subTitle) ? subTitle : subTitle?.[editorType];

  const readmeText = chartReadme && (
    <>
      {t('devconsole~For more information on the chart, refer to this')}{' '}
      <Button
        type="button"
        variant="link"
        data-test-id="helm-readme-modal"
        onClick={() =>
          helmReadmeModalLauncher({
            readme: chartReadme,
            modalClassName: 'modal-lg',
          })
        }
        isInline
      >
        {t('devconsole~README')}
      </Button>
    </>
  );

  const formHelpText = (
    <>
      {chartHasValues && <>{formSubTitle} &nbsp;</>}
      {readmeText}
    </>
  );

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormHeader title={title} helpText={formHelpText} marginBottom="lg" />
      {chartError && (
        <Alert variant="danger" isInline title="Helm chart cannot be installed">
          {t('devconsole~The Helm chart is currently unavailable. {{chartError}}', { chartError })}
        </Alert>
      )}
      <FormSection fullWidth>
        <Grid hasGutter>
          <GridItem xl={7} lg={8} md={12}>
            <InputField
              type={TextInputTypes.text}
              name="releaseName"
              label={t('devconsole~Release Name')}
              helpText={t('devconsole~A unique name for the Helm Chart release.')}
              required
              isDisabled={!!chartError || helmAction === HelmActionType.Upgrade}
            />
          </GridItem>
          <GridItem xl={5} lg={4} md={12}>
            <HelmChartVersionDropdown
              chartName={chartName}
              chartVersion={chartVersion}
              helmAction={helmAction}
              onVersionChange={onVersionChange}
            />
          </GridItem>
        </Grid>
      </FormSection>
      {!chartError && (
        <SyncedEditorField
          name="editorType"
          formContext={{ name: 'formData', editor: formEditor, isDisabled: !formSchema }}
          yamlContext={{ name: 'yamlData', editor: yamlEditor }}
        />
      )}
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={status?.isSubmitting || isSubmitting}
        submitLabel={helmAction}
        disableSubmit={isSubmitDisabled}
        resetLabel={t('devconsole~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default HelmInstallUpgradeForm;
