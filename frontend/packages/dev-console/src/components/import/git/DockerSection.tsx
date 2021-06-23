import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { BuildStrategyType } from '@console/internal/components/build';
import { InputField } from '@console/shared';
import FormSection from '../section/FormSection';

export interface DockerSectionProps {
  buildStrategy: BuildStrategyType;
}

const DockerSection: React.FC<DockerSectionProps> = ({ buildStrategy }) => {
  const { t } = useTranslation();
  return (
    buildStrategy === BuildStrategyType.Docker && (
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
