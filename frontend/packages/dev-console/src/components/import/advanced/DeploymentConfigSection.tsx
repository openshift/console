import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { CheckboxField, EnvironmentField } from '@console/shared';
import { Resources } from '../import-types';
import FormSection from '../section/FormSection';

export interface DeploymentConfigSectionProps {
  namespace: string;
  resource?: K8sResourceKind;
}

const DeploymentConfigSection: React.FC<DeploymentConfigSectionProps> = ({
  namespace,
  resource,
}) => {
  const { t } = useTranslation();
  const {
    values: {
      resources,
      deployment: { env },
    },
  } = useFormikContext<FormikValues>();
  const deploymentConfigObj = resource || {
    kind: 'DeploymentConfig',
    metadata: {
      namespace,
    },
  };

  return (
    <FormSection title={t('devconsole~Deployment')} fullWidth>
      <CheckboxField
        name="deployment.triggers.image"
        label={t('devconsole~Auto deploy when new Image is available')}
      />
      {resources === Resources.OpenShift && (
        <CheckboxField
          name="deployment.triggers.config"
          label={t('devconsole~Auto deploy when deployment configuration changes')}
        />
      )}
      <EnvironmentField
        name="deployment.env"
        label={t('devconsole~Environment variables (runtime only)')}
        envs={env}
        obj={deploymentConfigObj}
        envPath={['spec', 'template', 'spec', 'containers']}
      />
    </FormSection>
  );
};

export default DeploymentConfigSection;
