import type { FC } from 'react';
import { FormSection, TextInputTypes } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { DeploymentStrategyType } from '../utils/types';
import LifecycleHookField from './LifecycleHookField';

const AdvancedStrategyOptions: FC<{
  dataAttribute: string;
  resourceObj: K8sResourceKind;
}> = ({ dataAttribute, resourceObj }) => {
  const { t } = useTranslation('devconsole');
  const {
    values: {
      formData: {
        deploymentStrategy: { type },
      },
    },
  } = useFormikContext<FormikValues>();
  return (
    <ExpandCollapse
      textExpanded={t('Hide additional parameters and lifecycle hooks')}
      textCollapsed={t('Show additional parameters and lifecycle hooks')}
    >
      <FormSection>
        {type === DeploymentStrategyType.rollingParams && (
          <>
            <InputField
              name="formData.deploymentStrategy.rollingParams.updatePeriodSeconds"
              style={{ maxWidth: 'unset' }}
              label={t('Update Period')}
              type={TextInputTypes.number}
            />
            <InputField
              name="formData.deploymentStrategy.rollingParams.intervalSeconds"
              style={{ maxWidth: 'unset' }}
              label={t('Interval')}
              type={TextInputTypes.number}
            />
          </>
        )}
        <LifecycleHookField
          title={t('Pre Lifecycle Hook')}
          subTitle={t('Pre hooks execute before the deployment begins.')}
          dataAttribute={dataAttribute}
          resourceObj={resourceObj}
          lifecycleHookName="pre"
        />
        {type === DeploymentStrategyType.recreateParams && (
          <LifecycleHookField
            title={t('Mid Lifecycle Hook')}
            subTitle={t(
              'Mid hooks execute after the previous deployment is scaled down to zero and before the first pod of the new deployment is created.',
            )}
            dataAttribute={dataAttribute}
            resourceObj={resourceObj}
            lifecycleHookName="mid"
          />
        )}
        <LifecycleHookField
          title={t('Post Lifecycle Hook')}
          subTitle={t('Post hooks execute after the deployment strategy completes.')}
          dataAttribute={dataAttribute}
          resourceObj={resourceObj}
          lifecycleHookName="post"
        />
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedStrategyOptions;
