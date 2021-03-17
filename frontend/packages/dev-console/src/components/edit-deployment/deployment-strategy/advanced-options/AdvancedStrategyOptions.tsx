import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared/src';
import { ExpandCollapse } from '@console/internal/components/utils';
import FormSection from '../../../import/section/FormSection';
import { DeploymentStrategyType } from '../utils/types';

const AdvancedStrategyOptions: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      deploymentStrategy: { type },
    },
  } = useFormikContext<FormikValues>();
  return (
    <ExpandCollapse
      textExpanded={t('devconsole~Show additional parameters and lifecycle hooks')}
      textCollapsed={t('devconsole~Hide additional parameters and lifecycle hooks')}
    >
      <FormSection>
        {type === DeploymentStrategyType.rolling && (
          <>
            <InputField
              name="deploymentStrategy.data.updatePeriodSeconds"
              label={t('devconsole~Update Period')}
              type={TextInputTypes.number}
            />
            <InputField
              name="deploymentStrategy.data.intervalSeconds"
              label={t('devconsole~Interval')}
              type={TextInputTypes.number}
            />
          </>
        )}
        {/* Tod-do: Refactor HealthChecksProbe to make it a generic comp which can be used for adding both health checks and lifecycle hooks. */}
        {/* <LifecycleHooks /> */}
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedStrategyOptions;
