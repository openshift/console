import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, DroppableFileInputField } from '@console/shared';

type PipelineClusterOptionsProps = { prefixName: string };

const PipelineClusterOptions: React.FC<PipelineClusterOptionsProps> = ({ prefixName }) => {
  const { t } = useTranslation();
  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.name`}
        label={t('devconsole~Name')}
        helpText="Name of the cluster."
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.url`}
        label={t('devconsole~URL')}
        helpText={t('devconsole~Host URL of the master node.')}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.username`}
        label={t('devconsole~Username')}
        helpText={t('devconsole~The user with access to the cluster.')}
        required
      />
      <InputField
        type={TextInputTypes.password}
        name={`${prefixName}.params.password`}
        label={t('devconsole~Password')}
        helpText={t('devconsole~Please provide Password.')}
      />
      <InputField
        type={TextInputTypes.text}
        name={`${prefixName}.params.insecure`}
        label={t('devconsole~Insecure')}
        helpText={t(
          'devconsole~Indicate server should be accessed without verifying the TLS certificate.',
        )}
      />
      <DroppableFileInputField
        name={`${prefixName}.secrets.cadata`}
        label={t('devconsole~Cadata')}
        helpText={t(
          'devconsole~The PEM format certificate. Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
        )}
        required
      />
      <DroppableFileInputField
        name={`${prefixName}.secrets.token`}
        label={t('devconsole~Token')}
        helpText={t(
          'devconsole~Upload file by dragging & dropping, selecting it, or pasting from the clipboard.',
        )}
        required
      />
    </>
  );
};

export default PipelineClusterOptions;
