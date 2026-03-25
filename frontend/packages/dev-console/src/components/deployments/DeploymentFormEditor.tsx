import type { FC } from 'react';
import { useState } from 'react';
import { DeploymentConfigDeprecationAlert } from '@console/internal/components/deployment-config';
import { DeploymentConfigModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import SwitchToYAMLAlert from '@console/shared/src/components/alerts/SwitchToYAMLAlert';
import NameSection from '../buildconfig/sections/NameSection';
import type { Resources } from '../import/import-types';
import AdvancedSection from './AdvancedSection';
import DeploymentStrategySection from './deployment-strategy/DeploymentStrategySection';
import EnvironmentVariablesSection from './EnvironmentVariablesSection';
import ImagesSection from './images/ImagesSection';

export type EditDeploymentFormEditorProps = {
  resourceType: Resources;
  resourceObj: K8sResourceKind;
};

const EditDeploymentFormEditor: FC<EditDeploymentFormEditorProps> = ({
  resourceType,
  resourceObj,
}) => {
  const [showYAMLAlert, setShowYAMLAlert] = useState<boolean>(true);
  return (
    <>
      {resourceObj.kind === DeploymentConfigModel.kind && <DeploymentConfigDeprecationAlert />}
      {showYAMLAlert && <SwitchToYAMLAlert onClose={() => setShowYAMLAlert(false)} />}
      <NameSection />
      <DeploymentStrategySection resourceType={resourceType} resourceObj={resourceObj} />
      <ImagesSection resourceType={resourceType} />
      <EnvironmentVariablesSection resourceObj={resourceObj} />
      <AdvancedSection resourceType={resourceType} />
    </>
  );
};

export default EditDeploymentFormEditor;
