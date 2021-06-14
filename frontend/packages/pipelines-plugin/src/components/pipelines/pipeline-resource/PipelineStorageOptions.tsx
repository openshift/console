import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';

type PipelineStorageOptionsProps = { prefixName: string };

const PipelineStorageOptions: React.FC<PipelineStorageOptionsProps> = ({ prefixName }) => {
  const { t } = useTranslation();
  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.type`}
        label={t('pipelines-plugin~Type')}
        helpText={t('pipelines-plugin~Represents the type of blob storage i.e gcs')}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.location`}
        label={t('pipelines-plugin~Location')}
        helpText={t(
          'pipelines-plugin~Represents the location of the blob storage i.e gs://some-private-bucket',
        )}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.dir`}
        label={t('pipelines-plugin~Directory')}
        helpText={t('pipelines-plugin~Represents whether the blob storage is a directory or not')}
      />
    </>
  );
};

export default PipelineStorageOptions;
