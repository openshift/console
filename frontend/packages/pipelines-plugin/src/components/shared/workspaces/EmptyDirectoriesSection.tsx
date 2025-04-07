import * as React from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PipelineRunWorkspace } from '../../../types';

type EmptyDirectoriesSectionProps = {
  workspaces: PipelineRunWorkspace[];
};

const EmptyDirectoriesSection: React.FC<EmptyDirectoriesSectionProps> = ({ workspaces }) => {
  const { t } = useTranslation();

  if (!workspaces || workspaces.length === 0) return null;

  const emptyDirectoryWorkspaces = workspaces.filter((workspace) => !!workspace.emptyDir);
  if (emptyDirectoryWorkspaces.length === 0) return null;

  return (
    <DescriptionListGroup data-test-id="empty-directories-section">
      <DescriptionListTerm>{t('pipelines-plugin~Empty Directories')}</DescriptionListTerm>
      <DescriptionListDescription>
        {emptyDirectoryWorkspaces.map((workspace) => (
          <div key={workspace.name} data-test-id="empty-directory-workspace">
            {t(`pipelines-plugin~Empty Directory ({{workspaceName}})`, {
              workspaceName: workspace.name,
            })}
          </div>
        ))}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default EmptyDirectoriesSection;
