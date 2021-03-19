import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormikValues, useFormikContext } from 'formik';
import { FormSection } from '@patternfly/react-core';
import { DropdownField } from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DeploymentStrategyType, DeploymentStrategyDropdownData } from './utils/types';
import RecreateStrategy from './RecreateStrategy';
import RollingStrategy from './RollingStrategy';
import CustomStrategy from './CustomStrategy';

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
      deploymentStrategy: { type },
    },
  } = useFormikContext<FormikValues>();

  const deploymentStrategyFields = React.useMemo(() => {
    switch (type) {
      case DeploymentStrategyType.recreate:
        return <RecreateStrategy resourceType={resourceType} />;
      case DeploymentStrategyType.rolling:
        return <RollingStrategy resourceType={resourceType} />;
      case DeploymentStrategyType.custom:
        return <CustomStrategy resourceObj={resourceObj} />;
      default:
        return null;
    }
  }, [resourceObj, resourceType, type]);

  return (
    <FormSection title={t('devconsole~Deployment strategy')}>
      <DropdownField
        name="deploymentStrategy.type"
        label={t('devconsole~Strategy type')}
        items={DeploymentStrategyDropdownData[resourceType].items}
        helpText={DeploymentStrategyDropdownData[resourceType].helpText[type]}
      />
      {deploymentStrategyFields}
    </FormSection>
  );
};

export default DeploymentStrategySection;
