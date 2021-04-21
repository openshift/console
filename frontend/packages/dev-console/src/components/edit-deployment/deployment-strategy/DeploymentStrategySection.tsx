import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { DropdownField } from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DeploymentStrategyType, DeploymentStrategyDropdownData } from './utils/types';
import RecreateStrategy from './RecreateStrategy';
import RollingStrategy from './RollingStrategy';
import CustomStrategy from './CustomStrategy';
import FormSection from '../../import/section/FormSection';
import { getStrategyData } from '../utils/edit-deployment-utils';

export type DeploymentStrategySectionProps = {
  resourceType: string;
  resourceObj: K8sResourceKind;
};

const DeploymentStrategySection: React.FC<DeploymentStrategySectionProps> = ({
  resourceType,
  resourceObj,
}) => {
  const { t } = useTranslation();
  const {
    values: {
      formData: {
        name: resName,
        project: { name: resNamespace },
        deploymentStrategy: { type },
      },
    },
    setFieldValue,
  } = useFormikContext<FormikValues>();

  const deploymentStrategyFields = React.useMemo(() => {
    switch (type) {
      case DeploymentStrategyType.recreateParams:
        return <RecreateStrategy resourceType={resourceType} resourceObj={resourceObj} />;
      case DeploymentStrategyType.rollingParams:
      case DeploymentStrategyType.rollingUpdate:
        return <RollingStrategy resourceType={resourceType} resourceObj={resourceObj} />;
      case DeploymentStrategyType.customParams:
        return <CustomStrategy resourceObj={resourceObj} />;
      default:
        return null;
    }
  }, [type, resourceObj, resourceType]);

  return (
    <FormSection title={t('devconsole~Deployment strategy')}>
      <DropdownField
        name="formData.deploymentStrategy.type"
        label={t('devconsole~Strategy type')}
        items={DeploymentStrategyDropdownData[resourceType].items}
        helpText={DeploymentStrategyDropdownData[resourceType].helpText[type]}
        onChange={(value) => {
          const strategyDefaultValues = getStrategyData(value, {}, resName, resNamespace);
          setFieldValue('formData.deploymentStrategy', {
            ...(_.omit(resourceObj.spec?.strategy, [
              'rollingParams',
              'recreateParams',
              'customParams',
            ]) ?? {}),
            type: value,
            ...strategyDefaultValues,
          });
        }}
        fullWidth
      />
      {deploymentStrategyFields}
    </FormSection>
  );
};

export default DeploymentStrategySection;
