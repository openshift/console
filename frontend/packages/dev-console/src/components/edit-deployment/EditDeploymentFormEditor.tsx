import * as React from 'react';
import SwitchToYAMLAlert from '@console/dynamic-plugin-sdk/src/shared/components/alerts/SwitchToYAMLAlert';
import { K8sResourceKind } from '@console/internal/module/k8s';
import AdvancedSection from './AdvancedSection';
import DeploymentStrategySection from './deployment-strategy/DeploymentStrategySection';
import EnvironmentVariablesSection from './EnvironmentVariablesSection';
import ImagesSection from './images/ImagesSection';

export type EditDeploymentFormEditorProps = {
  resourceType: string;
  resourceObj: K8sResourceKind;
};

const EditDeploymentFormEditor: React.FC<EditDeploymentFormEditorProps> = ({
  resourceType,
  resourceObj,
}) => {
  const [showYAMLAlert, setShowYAMLAlert] = React.useState<boolean>(true);
  return (
    <>
      {showYAMLAlert && <SwitchToYAMLAlert onClose={() => setShowYAMLAlert(false)} />}
      <DeploymentStrategySection resourceType={resourceType} resourceObj={resourceObj} />
      <ImagesSection resourceType={resourceType} />
      <EnvironmentVariablesSection resourceObj={resourceObj} />
      <AdvancedSection resourceType={resourceType} />
    </>
  );
};

export default EditDeploymentFormEditor;
