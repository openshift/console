import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TektonWorkspace } from '../../../types';

export interface WorkspaceDefinitionListProps {
  workspaces: TektonWorkspace[];
}

const WorkspaceDefinitionList: React.FC<WorkspaceDefinitionListProps> = ({ workspaces }) => {
  const { t } = useTranslation();

  if (!workspaces || workspaces.length === 0) return null;

  return (
    <DescriptionList data-test-id="workspace-definition-section">
      <DescriptionListGroup>
        <DescriptionListTerm>{t('pipelines-plugin~Workspaces')}</DescriptionListTerm>
        <DescriptionListDescription>
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
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default WorkspaceDefinitionList;
