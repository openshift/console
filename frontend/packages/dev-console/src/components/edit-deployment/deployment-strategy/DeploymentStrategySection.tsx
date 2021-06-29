import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DropdownField } from '@console/shared/src';
import FormSection from '../../import/section/FormSection';
import { getStrategyData } from '../utils/edit-deployment-utils';
import CustomStrategy from './CustomStrategy';
import RecreateStrategy from './RecreateStrategy';
import RollingStrategy from './RollingStrategy';
import { DeploymentStrategyType, DeploymentStrategyDropdownData } from './utils/types';

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
    initialValues,
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

  const onChange = React.useCallback(
    (value) => {
      const strategyDefaultValues = getStrategyData(value, {}, resName, resNamespace, resourceType);
      const strategyData = {
        ..._.omit(resourceObj.spec?.strategy, [
          'rollingParams',
          'recreateParams',
          'customParams',
          'rollingUpdate',
        ]),
        type: value,
        ...strategyDefaultValues,
      };
      initialValues.formData.deploymentStrategy = strategyData;
      setFieldValue('formData.deploymentStrategy', strategyData);
    },
    [
      initialValues.formData.deploymentStrategy,
      resName,
      resNamespace,
      resourceObj.spec,
      resourceType,
      setFieldValue,
    ],
  );

  return (
    <FormSection title={t('devconsole~Deployment strategy')} dataTest="deployment-strategy-section">
      <DropdownField
        name="formData.deploymentStrategy.type"
        label={t('devconsole~Strategy type')}
        items={DeploymentStrategyDropdownData[resourceType].items}
        helpText={DeploymentStrategyDropdownData[resourceType].helpText[type]}
        onChange={onChange}
        fullWidth
      />
      {deploymentStrategyFields}
    </FormSection>
  );
};

export default DeploymentStrategySection;
