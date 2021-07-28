import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared/src';
import { Resources } from '../../import/import-types';
import AdvancedStrategyOptions from './advanced-options/AdvancedStrategyOptions';
import { StrategyFieldProps } from './utils/types';

const RecreateStrategy: React.FC<StrategyFieldProps> = ({ resourceType, resourceObj }) => {
  const { t } = useTranslation();
  return resourceType === Resources.OpenShift ? (
    <div data-test="recreateParams">
      <InputField
        name="formData.deploymentStrategy.recreateParams.timeoutSeconds"
        style={{ maxWidth: 'unset' }}
        label={t('devconsole~Timeout')}
        type={TextInputTypes.number}
        helpText={t(
          'devconsole~The number of seconds to wait for a pod to scale up before giving up',
        )}
      />
      <AdvancedStrategyOptions dataAttribute="recreateParams" resourceObj={resourceObj} />
    </div>
  ) : null;
};

export default RecreateStrategy;
