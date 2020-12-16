import * as React from 'react';
import * as _ from 'lodash';
import { CheckboxField, EnvironmentField } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import FormSection from '../section/FormSection';
import { useFormikContext, FormikValues } from 'formik';
import { Resources } from '../import-types';

export interface DeploymentConfigSectionProps {
  namespace: string;
  resource?: K8sResourceKind;
}

const DeploymentConfigSection: React.FC<DeploymentConfigSectionProps> = ({
  namespace,
  resource,
}) => {
  const {
    values: { resources },
  } = useFormikContext<FormikValues>();
  const deploymentConfigObj = resource || {
    kind: 'DeploymentConfig',
    metadata: {
      namespace,
    },
  };
  const envs = _.get(deploymentConfigObj, 'spec.template.spec.containers[0].env', []);
  return (
    <FormSection title="Deployment" fullWidth>
      <CheckboxField
        name="deployment.triggers.image"
        label="Auto deploy when new image is available"
      />
      {resources === Resources.OpenShift && (
        <CheckboxField
          name="deployment.triggers.config"
          label="Auto deploy when deployment configuration changes"
        />
      )}
      <EnvironmentField
        name="deployment.env"
        label="Environment Variables (Runtime only)"
        envs={envs}
        obj={deploymentConfigObj}
        envPath={['spec', 'template', 'spec', 'containers']}
      />
    </FormSection>
  );
};

export default DeploymentConfigSection;
