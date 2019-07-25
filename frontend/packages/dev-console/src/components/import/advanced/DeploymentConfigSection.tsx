import * as React from 'react';
import { CheckboxField, EnvironmentField } from '../../formik-fields';
import FormSection from '../section/FormSection';

export interface DeploymentConfigSectionProps {
  namespace: string;
}

const DeploymentConfigSection: React.FC<DeploymentConfigSectionProps> = ({ namespace }) => {
  const deploymentConfigObj = {
    kind: 'DeploymentConfig',
    metadata: {
      namespace,
    },
  };

  return (
    <FormSection title="Deployment Configuration" fullWidth>
      <CheckboxField
        name="deployment.triggers.image"
        label="Auto deploy when new image is available"
      />
      <CheckboxField
        name="deployment.triggers.config"
        label="Auto deploy when deployment configuration changes"
      />
      <EnvironmentField
        name="deployment.env"
        label="Environment Variables (Runtime only)"
        obj={deploymentConfigObj}
        envPath={['spec', 'template', 'spec', 'containers']}
      />
    </FormSection>
  );
};

export default DeploymentConfigSection;
