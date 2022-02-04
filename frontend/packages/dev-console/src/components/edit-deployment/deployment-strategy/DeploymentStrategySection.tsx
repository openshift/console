import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DropdownField } from '@console/shared/src';
import { Resources } from '../../import/import-types';
import FormSection from '../../import/section/FormSection';
import { getStrategyData } from '../utils/edit-deployment-utils';
import CustomStrategy from './CustomStrategy';
import RecreateStrategy from './RecreateStrategy';
import RollingStrategy from './RollingStrategy';
import {
  getDeploymentStrategyItems,
  getDeploymentStrategyHelpText,
} from './utils/deployment-strategy-utils';
import { DeploymentStrategyType } from './utils/types';

export type DeploymentStrategySectionProps = {
  resourceType: Resources;
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
        deploymentStrategy,
      },
    },
    initialValues,
    setFieldValue,
  } = useFormikContext<FormikValues>();

  const deploymentStrategyFields = React.useMemo(() => {
    switch (deploymentStrategy.type) {
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
  }, [deploymentStrategy.type, resourceObj, resourceType]);

  const onChange = React.useCallback(
    (value: DeploymentStrategyType) => {
      const strategyDefaultValues = getStrategyData(value, {}, resName, resNamespace, resourceType);
      const strategyData = {
        ...strategyDefaultValues,
        ...deploymentStrategy,
        type: value,
      };
      initialValues.formData.deploymentStrategy = strategyData;
      setFieldValue('formData.deploymentStrategy', strategyData);
    },
    [
      resName,
      resNamespace,
      resourceType,
      deploymentStrategy,
      initialValues.formData,
      setFieldValue,
    ],
  );

  return (
    <FormSection title={t('devconsole~Deployment strategy')} dataTest="deployment-strategy-section">
      <DropdownField
        name="formData.deploymentStrategy.type"
        label={t('devconsole~Strategy type')}
        items={getDeploymentStrategyItems(resourceType)}
        helpText={getDeploymentStrategyHelpText(resourceType, deploymentStrategy.type)}
        onChange={onChange}
        fullWidth
      />
      {deploymentStrategyFields}
    </FormSection>
  );
};

export default DeploymentStrategySection;
