import type { FC } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ImportStrategy } from '@console/git-service/src';
import { LoadingBox } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { CheckboxField, EnvironmentField } from '@console/shared';
import { Resources } from '../import-types';
import FormSection from '../section/FormSection';

export interface DeploymentConfigSectionProps {
  namespace: string;
  resource?: K8sResourceKind;
  showHeader?: boolean;
}

const DeploymentConfigSection: FC<DeploymentConfigSectionProps> = ({
  namespace,
  resource,
  showHeader,
}) => {
  const { t } = useTranslation();
  const {
    values: {
      resources,
      deployment: { env },
      import: { selectedStrategy, knativeFuncLoaded: funcLoaded },
    },
  } = useFormikContext<FormikValues>();
  const deploymentConfigObj = resource || {
    kind: 'DeploymentConfig',
    metadata: {
      namespace,
    },
  };

  return (
    <FormSection title={showHeader && t('devconsole~Deployment')} fullWidth>
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
      {(
        selectedStrategy.type === ImportStrategy.SERVERLESS_FUNCTION ? funcLoaded ?? false : true
      ) ? (
        <EnvironmentField
          name="deployment.env"
          label={t('devconsole~Environment variables (runtime only)')}
          envs={env}
          obj={deploymentConfigObj}
        />
      ) : (
        <LoadingBox />
      )}
    </FormSection>
  );
};

export default DeploymentConfigSection;
