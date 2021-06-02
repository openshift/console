import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';

type PipelineImageOptionsProps = { prefixName: string };

const PipelineImageOptions: React.FC<PipelineImageOptionsProps> = ({ prefixName }) => {
  const { t } = useTranslation();
  return (
    <InputField
      type={TextInputTypes.text}
      name={`${prefixName}.params.url`}
      label={t('pipelines-plugin~URL')}
      helpText={t('pipelines-plugin~Please provide Image URL.')}
      required
    />
  );
};

export default PipelineImageOptions;
