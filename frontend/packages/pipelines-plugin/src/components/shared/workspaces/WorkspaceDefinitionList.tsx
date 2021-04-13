import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TektonWorkspace } from '../../../types';

export interface WorkspaceDefinitionListProps {
  workspaces: TektonWorkspace[];
}

const WorkspaceDefinitionList: React.FC<WorkspaceDefinitionListProps> = ({ workspaces }) => {
  const { t } = useTranslation();

  if (!workspaces || workspaces.length === 0) return null;

  return (
    <dl data-test-id="workspace-definition-section">
      <dt>{t('pipelines-plugin~Workspaces')}</dt>
      <dd>
        {workspaces.map((workspace) => (
          <div
            key={workspace.name}
            data-test-id={`workspace-definition${workspace.optional ? '-optional' : ''}`}
          >
            {workspace.optional
              ? `${workspace.name} (${t('pipelines-plugin~optional')})`
              : `${workspace.name}`}
          </div>
        ))}
      </dd>
    </dl>
  );
};

export default WorkspaceDefinitionList;
