import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared/src';
import { Resources } from '../../import/import-types';
import AdvancedStrategyOptions from './advanced-options/AdvancedStrategyOptions';
import { StrategyFieldProps } from './utils/types';

const RollingStrategy: React.FC<StrategyFieldProps> = ({ resourceType, resourceObj }) => {
  const { t } = useTranslation();
  const dataAttribute = resourceType === Resources.OpenShift ? 'rollingParams' : 'rollingUpdate';
  return (
    <div data-test={dataAttribute}>
      {resourceType === Resources.OpenShift && (
        <InputField
          name="formData.deploymentStrategy.rollingParams.timeoutSeconds"
          style={{ maxWidth: 'unset' }}
          label={t('devconsole~Timeout')}
          type={TextInputTypes.number}
          helpText={t(
            'devconsole~The number of seconds to wait for a pod to scale up before giving up',
          )}
        />
      )}
      <InputField
        name={`formData.deploymentStrategy.${dataAttribute}.maxUnavailable`}
        label={t('devconsole~Maximum number of unavailable Pods')}
        helpText={t(
          'devconsole~The maximum number of pods that can be unavailable during the rolling deployment. This can be either a percentage (10%) or a whole number (1).',
        )}
      />
      <InputField
        name={`formData.deploymentStrategy.${dataAttribute}.maxSurge`}
        label={t('devconsole~Maximum number of surge Pods')}
        helpText={t(
          'devconsole~The maximum number of pods that can be scheduled above the original number of pods while the rolling deployment is in progress. This can be either a percentage (10%) or a whole number (1).',
        )}
      />
      {resourceType === Resources.OpenShift && (
        <AdvancedStrategyOptions dataAttribute="rollingParams" resourceObj={resourceObj} />
      )}
    </div>
  );
};

export default RollingStrategy;
