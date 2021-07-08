import * as React from 'react';
import { FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import PipelineParameterSection from '../common/PipelineParameterSection';
import PipelineResourceSection from '../common/PipelineResourceSection';
import PipelineSecretSection from '../common/PipelineSecretSection';
import PipelineWorkspacesSection from '../common/PipelineWorkspacesSection';
import { StartPipelineFormValues } from './types';

const StartPipelineForm: React.FC<FormikProps<StartPipelineFormValues>> = () => {
  const { t } = useTranslation();
  return (
    <>
      <PipelineParameterSection />
      <PipelineResourceSection />
      <PipelineWorkspacesSection />
      <FormSection title={t('pipelines-plugin~Advanced options')} fullWidth>
        <PipelineSecretSection />
      </FormSection>
    </>
  );
};

export default StartPipelineForm;
