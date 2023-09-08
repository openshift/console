import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { getGitService } from '@console/git-service/src';
import { FLAG_OPENSHIFT_PIPELINE_AS_CODE } from '@console/pipelines-plugin/src/const';
import { useFlag } from '@console/shared/src';
import { AppResources } from '../../edit-application/edit-application-types';
import BuildConfigSection from '../advanced/BuildConfigSection';
import { BuildOptions } from '../import-types';
import { BuildOption } from './BuildOptions';
import FormSection from './FormSection';

type BuildSectionProps = {
  values: FormikValues;
  appResources?: AppResources;
};

export const BuildSection: React.FC<BuildSectionProps> = ({ values, appResources }) => {
  const { t } = useTranslation();
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);

  const { setFieldValue } = useFormikContext<FormikValues>();

  /* Auto-select Pipelines as Build option for PAC Repositories */
  React.useEffect(() => {
    const { git, formType } = values || {};

    if (formType !== 'edit' && git?.url) {
      const gitService = getGitService(
        git?.url,
        git?.type,
        git?.ref,
        git?.dir,
        git?.secretResource,
      );
      const checkTektonFolder = async () => {
        const res = await gitService?.isTektonFolderPresent();
        if (isRepositoryEnabled && res) {
          setFieldValue('build.option', BuildOptions.PIPELINES);
        }
      };
      gitService && checkTektonFolder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.git?.url, isRepositoryEnabled, setFieldValue]);

  React.useEffect(() => {
    if (values?.formType === 'edit' && values?.pipeline?.enabled) {
      setFieldValue('build.option', BuildOptions.PIPELINES);
    }
  }, [values, setFieldValue]);

  React.useEffect(() => {
    if (
      values?.formType !== 'edit' &&
      values.pipeline?.enabled &&
      values.build.option !== BuildOptions.PIPELINES
    ) {
      setFieldValue('pipeline.enabled', false);
      setFieldValue('pac.pipelineEnabled', false);
    }
  }, [setFieldValue, values.pipeline?.enabled, values.build.option, values.formType]);

  return (
    <FormSection title={t('devconsole~Build')}>
      <BuildOption isDisabled={values?.formType === 'edit'} />

      {values.isi || values.pipeline?.enabled ? null : (
        <ExpandableSection toggleText={t('devconsole~Show advanced Build option')}>
          <BuildConfigSection
            namespace={values.project.name}
            resource={appResources?.buildConfig?.data}
            showHeader={false}
          />
        </ExpandableSection>
      )}
    </FormSection>
  );
};
