import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';

type PipelineGitOptionsProps = { prefixName: string };

const PipelineGitOptions: React.FC<PipelineGitOptionsProps> = ({ prefixName }) => {
  const { t } = useTranslation();
  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.url`}
        label={t('pipelines-plugin~URL')}
        helpText={t('pipelines-plugin~Please provide Git URL.')}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.revision`}
        label={t('pipelines-plugin~Revision')}
        helpText={t('pipelines-plugin~Please provide revisions. i.e master')}
      />
    </>
  );
};

export default PipelineGitOptions;
