import * as React from 'react';
import { TextInputTypes, Grid, GridItem, Button, Alert } from '@patternfly/react-core';
import { FormikProps } from 'formik';
import { JSONSchema7 } from 'json-schema';
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
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { HelmActionType, HelmChart, HelmActionConfigType } from '../../../types/helm-types';
import { helmActionString } from '../../../utils/helm-utils';
import HelmChartVersionDropdown from './HelmChartVersionDropdown';
import { useHelmReadmeModalLauncher } from './HelmReadmeModal';

export type HelmInstallUpgradeFormData = {
  releaseName: string;
  chartURL?: string;
  chartName: string;
  chartIndexEntry?: string;
  chartRepoName: string;
  chartVersion: string;
  chartReadme: string;
  appVersion: string;
  yamlData: string;
  formData: any;
  formSchema: JSONSchema7;
  editorType: EditorType;
};

export interface HelmInstallUpgradeFormProps {
  chartHasValues: boolean;
  helmActionConfig: HelmActionConfigType;
  chartMetaDescription: React.ReactNode;
  onVersionChange: (chart: HelmChart) => void;
  chartError: Error;
  namespace: string;
  chartIndexEntry?: string;
  annotatedName?: string;
  providerName?: string;
}

const HelmInstallUpgradeForm: React.FC<
  FormikProps<HelmInstallUpgradeFormData> & HelmInstallUpgradeFormProps
> = ({
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
  namespace,
  chartIndexEntry,
  annotatedName,
  providerName,
}) => {
  const { t } = useTranslation();
  const theme = React.useContext(ThemeContext);
  const { chartName, chartVersion, chartReadme, formData, formSchema, editorType } = values;
  const { type: helmAction, title, subTitle } = helmActionConfig;
  const helmReadmeModalLauncher = useHelmReadmeModalLauncher({
    readme: chartReadme,
    theme,
  });
  const isSubmitDisabled =
    (helmAction === HelmActionType.Upgrade && !dirty) ||
    isSubmitting ||
    !_.isEmpty(errors) ||
    !!chartError;

  const uiSchema = React.useMemo(() => getJSONSchemaOrder(formSchema, {}), [formSchema]);

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'helm.installUgradeForm.editor.lastView';

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

  const formSubTitle = _.isString(subTitle) ? subTitle : subTitle?.[editorType];

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
      {chartHasValues && <>{formSubTitle} &nbsp;</>}
      {readmeText}
    </>
  );

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <FormHeader title={title} helpText={formHelpText} marginBottom="lg" />
        {chartError && (
          <Alert variant="danger" isInline title={t('helm-plugin~Helm Chart cannot be installed')}>
            {t('helm-plugin~The Helm Chart is currently unavailable. {{chartError}}', {
              chartError,
            })}
          </Alert>
        )}
        <FormSection fullWidth>
          <Grid hasGutter>
            <GridItem xl={7} lg={8} md={12}>
              <InputField
                type={TextInputTypes.text}
                name="releaseName"
                label={t('helm-plugin~Release name')}
                helpText={t('helm-plugin~A unique name for the Helm Release.')}
                required
                isDisabled={!!chartError || helmAction === HelmActionType.Upgrade}
                data-test="release-name"
              />
            </GridItem>
            <GridItem xl={5} lg={4} md={12}>
              <HelmChartVersionDropdown
                chartName={chartName}
                chartVersion={chartVersion}
                helmAction={helmAction}
                onVersionChange={onVersionChange}
                namespace={namespace}
                chartIndexEntry={chartIndexEntry || ''}
                annotatedName={annotatedName}
                providerName={providerName}
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
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={helmActionString(t)[helmAction]}
        disableSubmit={isSubmitDisabled}
        resetLabel={t('helm-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default HelmInstallUpgradeForm;
