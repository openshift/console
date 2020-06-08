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
  helmAction: string;
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
}) => {
  const { chartName, chartVersion } = values;
  const isSubmitDisabled =
    (helmAction === HelmActionType.Upgrade && !dirty) || status?.isSubmitting || !_.isEmpty(errors);
  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormSection fullWidth>
        <Grid gutter={'md'}>
          <GridItem span={6}>
            <InputField
              type={TextInputTypes.text}
              name="helmReleaseName"
              label="Release Name"
              helpText="A unique name for the Helm Chart release."
              required
              isDisabled={helmAction === HelmActionType.Upgrade}
            />
          </GridItem>
          <HelmChartVersionDropdown
            chartName={chartName}
            chartVersion={chartVersion}
            helmAction={helmAction}
          />
        </Grid>
      </FormSection>
      {chartHasValues && <YAMLEditorField name="chartValuesYAML" onSave={handleSubmit} />}
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={status?.isSubmitting || isSubmitting}
        submitLabel={helmAction}
        disableSubmit={isSubmitDisabled}
        resetLabel="Cancel"
      />
    </FlexForm>
  );
};

export default HelmInstallUpgradeForm;
