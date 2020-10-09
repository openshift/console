import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import FormSection from '../section/FormSection';

export interface DockerSectionProps {
  buildStrategy: string;
}

const DockerSection: React.FC<DockerSectionProps> = ({ buildStrategy }) => {
  const { t } = useTranslation();
  return (
    buildStrategy === 'Docker' && (
      <FormSection title={t('devconsole~Dockerfile')}>
        <InputField
          type={TextInputTypes.text}
          name="docker.dockerfilePath"
          label={t('devconsole~Dockerfile Path')}
          helpText={t(
            'devconsole~Allows the builds to use a different path to locate your Dockerfile, relative to the Context Dir field.',
          )}
        />
        <InputField
          type={TextInputTypes.number}
          name="docker.containerPort"
          label={t('devconsole~Container Port')}
          helpText={t('devconsole~Port number the container exposes.')}
          style={{ maxWidth: '100%' }}
        />
      </FormSection>
    )
  );
};

export default DockerSection;
