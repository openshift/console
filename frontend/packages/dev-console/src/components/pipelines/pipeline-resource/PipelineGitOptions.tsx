import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';

type PipelineGitOptionsProps = { prefixName: string };

const PipelineGitOptions: React.FC<PipelineGitOptionsProps> = ({ prefixName }) => {
  const { t } = useTranslation();
  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.url`}
        label={t('devconsole~URL')}
        helpText={t('devconsole~Please provide Git URL.')}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.revision`}
        label={t('devconsole~Revision')}
        helpText={t('devconsole~Please provide Revisions. i.e master')}
      />
    </>
  );
};

export default PipelineGitOptions;
