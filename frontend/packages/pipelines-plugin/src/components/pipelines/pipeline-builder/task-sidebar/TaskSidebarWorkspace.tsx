import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup, ValidatedOptions } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { PipelineTaskWorkspace, PipelineWorkspace } from '../../../../types';
import { SidebarInputWrapper } from './temp-utils';

type TaskSidebarWorkspaceProps = {
  availableWorkspaces: PipelineWorkspace[];
  taskWorkspace: PipelineTaskWorkspace;
  selectedWorkspace?: PipelineTaskWorkspace;
  onChange: (workspaceName: string, workspace: string) => void;
};

const TaskSidebarWorkspace: React.FC<TaskSidebarWorkspaceProps> = (props) => {
  const { availableWorkspaces, taskWorkspace, selectedWorkspace, onChange } = props;
  const { t } = useTranslation();

  return (
    <FormGroup
      fieldId={taskWorkspace.name}
      label={taskWorkspace.name}
      helperTextInvalid={
        availableWorkspaces.length === 0
          ? t('pipelines-plugin~No workspaces available. Add pipeline workspaces.')
          : ''
      }
      validated={availableWorkspaces.length > 0 ? ValidatedOptions.default : ValidatedOptions.error}
      isRequired
    >
      <SidebarInputWrapper>
        <Dropdown
          title={t('pipelines-plugin~Select workspace...')}
          items={availableWorkspaces.reduce((acc, { name }) => ({ ...acc, [name]: name }), {})}
          disabled={availableWorkspaces.length === 0}
          selectedKey={selectedWorkspace?.workspace}
          dropDownClassName="dropdown--full-width"
          onChange={(value: string) => {
            onChange(taskWorkspace.name, value);
          }}
        />
      </SidebarInputWrapper>
    </FormGroup>
  );
};

export default TaskSidebarWorkspace;
