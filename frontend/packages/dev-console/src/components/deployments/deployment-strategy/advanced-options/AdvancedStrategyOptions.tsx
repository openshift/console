import * as React from 'react';
import { FormSection, TextInputTypes } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { InputField } from '@console/shared/src';
import { DeploymentStrategyType } from '../utils/types';
import LifecycleHookField from './LifecycleHookField';

const AdvancedStrategyOptions: React.FC<{
  dataAttribute: string;
  resourceObj: K8sResourceKind;
}> = ({ dataAttribute, resourceObj }) => {
  const { t } = useTranslation();
  const {
    values: {
      formData: {
        deploymentStrategy: { type },
      },
    },
  } = useFormikContext<FormikValues>();
  return (
    <ExpandCollapse
      textExpanded={t('devconsole~Hide additional parameters and lifecycle hooks')}
      textCollapsed={t('devconsole~Show additional parameters and lifecycle hooks')}
    >
      <FormSection>
        {type === DeploymentStrategyType.rollingParams && (
          <>
            <InputField
              name="formData.deploymentStrategy.rollingParams.updatePeriodSeconds"
              style={{ maxWidth: 'unset' }}
              label={t('devconsole~Update Period')}
              type={TextInputTypes.number}
            />
            <InputField
              name="formData.deploymentStrategy.rollingParams.intervalSeconds"
              style={{ maxWidth: 'unset' }}
              label={t('devconsole~Interval')}
              type={TextInputTypes.number}
            />
          </>
        )}
        <LifecycleHookField
          title={t('devconsole~Pre Lifecycle Hook')}
          subTitle={t('devconsole~Pre hooks execute before the deployment begins.')}
          dataAttribute={dataAttribute}
          resourceObj={resourceObj}
          lifecycleHookName="pre"
        />
        {type === DeploymentStrategyType.recreateParams && (
          <LifecycleHookField
            title={t('devconsole~Mid Lifecycle Hook')}
            subTitle={t(
              'devconsole~Mid hooks execute after the previous deployment is scaled down to zero and before the first pod of the new deployment is created.',
            )}
            dataAttribute={dataAttribute}
            resourceObj={resourceObj}
            lifecycleHookName="mid"
          />
        )}
        <LifecycleHookField
          title={t('devconsole~Post Lifecycle Hook')}
          subTitle={t('devconsole~Post hooks execute after the deployment strategy completes.')}
          dataAttribute={dataAttribute}
          resourceObj={resourceObj}
          lifecycleHookName="post"
        />
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedStrategyOptions;
