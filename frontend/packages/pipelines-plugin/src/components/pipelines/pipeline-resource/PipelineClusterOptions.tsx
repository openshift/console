import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField, DroppableFileInputField } from '@console/shared';

type PipelineClusterOptionsProps = { prefixName: string };

const PipelineClusterOptions: React.FC<PipelineClusterOptionsProps> = ({ prefixName }) => {
  const { t } = useTranslation();
  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.name`}
        label={t('pipelines-plugin~Name')}
        helpText={t('pipelines-plugin~Name of the cluster.')}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.url`}
        label={t('pipelines-plugin~URL')}
        helpText={t('pipelines-plugin~Host URL of the master node.')}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.username`}
        label={t('pipelines-plugin~Username')}
        helpText={t('pipelines-plugin~The user with access to the cluster.')}
        required
      />
      <InputField
        type={TextInputTypes.password}
        name={`${prefixName}.params.password`}
        label={t('pipelines-plugin~Password')}
        helpText={t('pipelines-plugin~Please provide password.')}
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.insecure`}
        label={t('pipelines-plugin~Insecure')}
        helpText={t(
          'pipelines-plugin~Indicate server should be accessed without verifying the TLS certificate.',
        )}
      />
      <DroppableFileInputField
        name={`${prefixName}.secrets.cadata`}
        label={t('pipelines-plugin~Cadata')}
        helpText={t(
          'pipelines-plugin~The PEM format certificate. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
        )}
        required
      />
      <DroppableFileInputField
        name={`${prefixName}.secrets.token`}
        label={t('pipelines-plugin~Token')}
        helpText={t(
          'pipelines-plugin~Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
        )}
        required
      />
    </>
  );
};

export default PipelineClusterOptions;
