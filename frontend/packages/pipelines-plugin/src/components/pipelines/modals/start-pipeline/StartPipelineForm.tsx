import * as React from 'react';
import { FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import PipelineParameterSection from '../common/PipelineParameterSection';
import PipelineResourceSection from '../common/PipelineResourceSection';
import PipelineWorkspacesSection from '../common/PiplelineWorkspacesSection';
import PipelineSecretSection from '../common/PipelineSecretSection';

const StartPipelineForm: React.FC<FormikValues> = ({ values }) => {
  const { t } = useTranslation();
  return (
    <>
      <PipelineParameterSection parameters={values.parameters} />
      <PipelineResourceSection />
      <PipelineWorkspacesSection />
      <FormSection title={t('pipelines-plugin~Advanced Options')} fullWidth>
        <PipelineSecretSection namespace={values.namespace} />
      </FormSection>
    </>
  );
};

export default StartPipelineForm;
