import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { TextInputTypes, Grid, GridItem } from '@patternfly/react-core';
import { InputField, FormFooter, FlexForm, YAMLEditorField } from '@console/shared';
import FormSection from '../../import/section/FormSection';
import { HelmActionType } from '../helm-types';
import HelmChartVersionDropdown from './HelmChartVersionDropdown';

export interface HelmInstallUpgradeFormProps {
  chartHasValues: boolean;
  submitLabel: string;
}

const HelmInstallUpgradeForm: React.FC<FormikProps<FormikValues> & HelmInstallUpgradeFormProps> = ({
  chartHasValues,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  submitLabel,
  values,
  dirty,
}) => {
  const { chartName, chartVersion } = values;
  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormSection fullWidth>
        <Grid gutter={'md'}>
          <GridItem span={submitLabel === HelmActionType.Install ? 12 : 6}>
            <InputField
              type={TextInputTypes.text}
              name="helmReleaseName"
              label="Release Name"
              helpText="A unique name for the Helm Chart release."
              required
              isDisabled={!!chartVersion}
            />
          </GridItem>
          {chartVersion && (
            <HelmChartVersionDropdown chartName={chartName} chartVersion={chartVersion} />
          )}
        </Grid>
      </FormSection>
      {chartHasValues && <YAMLEditorField name="chartValuesYAML" onSave={handleSubmit} />}
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        disableSubmit={(chartVersion && !dirty) || !_.isEmpty(errors)}
        resetLabel="Cancel"
      />
    </FlexForm>
  );
};

export default HelmInstallUpgradeForm;
