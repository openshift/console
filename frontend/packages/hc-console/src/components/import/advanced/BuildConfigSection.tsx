import * as React from 'react';
import * as _ from 'lodash';
import { CheckboxField, EnvironmentField } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getStrategyType } from '@console/internal/components/build';
import FormSection from '../section/FormSection';

export interface BuildConfigSectionProps {
  namespace: string;
  resource?: K8sResourceKind;
}

const BuildConfigSection: React.FC<BuildConfigSectionProps> = ({ namespace, resource }) => {
  const buildConfigObj = resource || {
    kind: 'BuildConfig',
    metadata: {
      namespace,
    },
  };
  const strategyType = getStrategyType(resource?.spec?.strategy?.type);
  const envs = _.get(buildConfigObj, `spec.strategy.${strategyType}.env`, []);
  return (
    <FormSection title="Build Configuration" fullWidth>
      <CheckboxField name="build.triggers.webhook" label="Configure a webhook build trigger" />
      <CheckboxField
        name="build.triggers.image"
        label="Automatically build a new image when the builder image changes"
      />
      <CheckboxField
        name="build.triggers.config"
        label="Launch the first build when the build configuration is created"
      />
      <EnvironmentField
        name="build.env"
        label="Environment Variables (Build and Runtime)"
        obj={buildConfigObj}
        envs={envs}
        envPath={['spec', 'strategy']}
      />
    </FormSection>
  );
};

export default BuildConfigSection;
