import * as React from 'react';
import { PipelineRunWorkspace } from '../../../types';
import EmptyDirectoriesSection from './EmptyDirectoriesSection';
import VolumeClaimTemplateSection from './VolumeClaimTemplateSection';
import WorkspaceResourcesSection from './WorkspaceResourcesSection';

export interface WorkspaceResourceLinkListProps {
  workspaces: PipelineRunWorkspace[];
  namespace: string;
  ownerResourceName: string;
  ownerResourceKind?: string;
}

const WorkspaceResourceLinkList: React.FC<WorkspaceResourceLinkListProps> = ({
  workspaces,
  namespace,
  ownerResourceName,
  ownerResourceKind,
}) => {
  if (!workspaces || workspaces.length === 0) return null;

  return (
    <>
      <WorkspaceResourcesSection namespace={namespace} workspaces={workspaces} />
      <VolumeClaimTemplateSection
        namespace={namespace}
        ownerResourceName={ownerResourceName}
        ownerResourceKind={ownerResourceKind}
      />
      <EmptyDirectoriesSection workspaces={workspaces} />
    </>
  );
};

export default WorkspaceResourceLinkList;
