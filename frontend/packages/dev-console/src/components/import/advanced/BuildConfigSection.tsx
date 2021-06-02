import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getStrategyType } from '@console/internal/components/build';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { CheckboxField, EnvironmentField } from '@console/shared';
import FormSection from '../section/FormSection';

export interface BuildConfigSectionProps {
  namespace: string;
  resource?: K8sResourceKind;
}

const BuildConfigSection: React.FC<BuildConfigSectionProps> = ({ namespace, resource }) => {
  const { t } = useTranslation();
  const {
    values: { build },
  } = useFormikContext<FormikValues>();
  const buildConfigObj = resource || {
    kind: 'BuildConfig',
    metadata: {
      namespace,
    },
  };
  const strategyType = getStrategyType(resource?.spec?.strategy?.type);
  const envs = _.get(buildConfigObj, `spec.strategy.${strategyType}.env`, []);
  return (
    <FormSection title={t('devconsole~Build configuration')} fullWidth>
      {typeof build?.triggers?.webhook === 'boolean' && (
        <CheckboxField
          name="build.triggers.webhook"
          label={t('devconsole~Configure a webhook build trigger')}
        />
      )}
      {typeof build?.triggers?.image === 'boolean' && (
        <CheckboxField
          name="build.triggers.image"
          label={t('devconsole~Automatically build a new Image when the Builder Image changes')}
        />
      )}
      {typeof build?.triggers?.config === 'boolean' && (
        <CheckboxField
          name="build.triggers.config"
          label={t('devconsole~Launch the first build when the build configuration is created')}
        />
      )}
      <EnvironmentField
        name="build.env"
        label={t('devconsole~Environment variables (build and runtime)')}
        obj={buildConfigObj}
        envs={envs}
        envPath={['spec', 'strategy']}
      />
    </FormSection>
  );
};

export default BuildConfigSection;
