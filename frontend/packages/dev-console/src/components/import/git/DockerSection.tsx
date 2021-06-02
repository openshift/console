import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
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
          label={t('devconsole~Dockerfile path')}
          helpText={t(
            'devconsole~Allows the builds to use a different path to locate your Dockerfile, relative to the Context Dir field.',
          )}
        />
      </FormSection>
    )
  );
};

export default DockerSection;
