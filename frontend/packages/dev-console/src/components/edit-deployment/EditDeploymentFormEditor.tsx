import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import AdvancedSection from './AdvancedSection';
import DeploymentStrategySection from './deployment-strategy/DeploymentStrategySection';
import ImagesSection from './images/ImagesSection';

export type EditDeploymentFormEditorProps = {
  resourceType: string;
  resourceObj: K8sResourceKind;
};

const EditDeploymentFormEditor: React.FC<EditDeploymentFormEditorProps> = ({
  resourceType,
  resourceObj,
}) => {
  return (
    <>
      <DeploymentStrategySection resourceType={resourceType} resourceObj={resourceObj} />
      <ImagesSection resourceType={resourceType} />
      <AdvancedSection />
    </>
  );
};

export default EditDeploymentFormEditor;
