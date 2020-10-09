import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';

type PipelineStorageOptionsProps = { prefixName: string };

const PipelineStorageOptions: React.FC<PipelineStorageOptionsProps> = ({ prefixName }) => {
  const { t } = useTranslation();
  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.type`}
        label={t('devconsole~Type')}
        helpText={t('devconsole~Represents the type of blob storage i.e gcs')}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.location`}
        label={t('devconsole~Location')}
        helpText={t(
          'devconsole~Represents the location of the blob storage i.e gs://some-private-bucket',
        )}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.dir`}
        label={t('devconsole~Directory')}
        helpText={t('devconsole~Represents whether the blob storage is a directory or not')}
      />
    </>
  );
};

export default PipelineStorageOptions;
