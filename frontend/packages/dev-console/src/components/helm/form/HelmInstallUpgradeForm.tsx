import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { TextInputTypes, Grid, GridItem } from '@patternfly/react-core';
import {
  InputField,
  FormFooter,
  FlexForm,
  YAMLEditorField,
  DynamicFormField,
  SyncedEditorField,
} from '@console/shared';
import { getJSONSchemaOrder } from '@console/shared/src/components/dynamic-form/utils';
import FormSection from '../../import/section/FormSection';
import { HelmActionType, HelmChart } from '../helm-types';
import HelmChartVersionDropdown from './HelmChartVersionDropdown';

export interface HelmInstallUpgradeFormProps {
  chartHasValues: boolean;
  helmAction: string;
  chartMetaDescription: React.ReactNode;
  onVersionChange: (chart: HelmChart) => void;
}

const HelmInstallUpgradeForm: React.FC<FormikProps<FormikValues> & HelmInstallUpgradeFormProps> = ({
  chartHasValues,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  helmAction,
  values,
  dirty,
  chartMetaDescription,
  onVersionChange,
}) => {
  const { chartName, chartVersion, formData, formSchema } = values;

  const isSubmitDisabled =
    (helmAction === HelmActionType.Upgrade && !dirty) || status?.isSubmitting || !_.isEmpty(errors);

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

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormSection fullWidth>
        <Grid gutter={'md'}>
          <GridItem xl={6} lg={6} md={12} sm={12}>
            <InputField
              type={TextInputTypes.text}
              name="releaseName"
              label="Release Name"
              helpText="A unique name for the Helm Chart release."
              required
              isDisabled={helmAction === HelmActionType.Upgrade}
            />
          </GridItem>
          <GridItem xl={6} lg={6} md={12} sm={12}>
            <HelmChartVersionDropdown
              chartName={chartName}
              chartVersion={chartVersion}
              helmAction={helmAction}
              onVersionChange={onVersionChange}
            />
          </GridItem>
        </Grid>
      </FormSection>
      <SyncedEditorField
        name="editorType"
        formContext={{ name: 'formData', editor: formEditor, isDisabled: !formSchema }}
        yamlContext={{ name: 'yamlData', editor: yamlEditor }}
      />
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={status?.isSubmitting || isSubmitting}
        submitLabel={helmAction}
        disableSubmit={isSubmitDisabled}
        resetLabel="Cancel"
        sticky
      />
    </FlexForm>
  );
};

export default HelmInstallUpgradeForm;
