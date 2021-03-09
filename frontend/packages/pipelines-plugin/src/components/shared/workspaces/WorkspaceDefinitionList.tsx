import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineWorkspace, PipelineTaskWorkspace } from 'packages/pipelines-plugin/src/types';

type WorkspaceDefinition = PipelineWorkspace | PipelineTaskWorkspace;

export interface WorkspaceDefinitionListProps {
  workspaces: WorkspaceDefinition[];
}

const WorkspaceDefinitionList: React.FC<WorkspaceDefinitionListProps> = ({ workspaces }) => {
  const { t } = useTranslation();

  if (!workspaces || workspaces.length === 0) return null;

  return (
    <dl>
      <dt>{t('pipelines-plugin~Workspaces')}</dt>
      <dd>
        {workspaces.map((workspace) => (
          <div key={workspace.name}>{workspace.name}</div>
        ))}
      </dd>
    </dl>
  );
};

export default WorkspaceDefinitionList;
