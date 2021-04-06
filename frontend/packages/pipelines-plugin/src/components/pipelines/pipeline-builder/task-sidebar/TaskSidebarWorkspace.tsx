import * as React from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField } from '@console/shared';
import { TektonWorkspace } from '../../../../types';
import { PipelineBuilderFormikValues } from '../types';

type TaskSidebarWorkspaceProps = {
  availableWorkspaces: TektonWorkspace[];
  hasWorkspace: boolean;
  name: string;
  resourceWorkspace: TektonWorkspace;
};

const TaskSidebarWorkspace: React.FC<TaskSidebarWorkspaceProps> = (props) => {
  const {
    availableWorkspaces,
    hasWorkspace,
    name,
    resourceWorkspace: { name: workspaceName, optional = false },
  } = props;
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<PipelineBuilderFormikValues>();

  return (
    <DropdownField
      name={`${name}.workspace`}
      label={workspaceName}
      title={t('pipelines-plugin~Select workspace...')}
      disabled={availableWorkspaces.length === 0}
      items={availableWorkspaces.reduce(
        (acc, workspace) => ({ ...acc, [workspace.name]: workspace.name }),
        {},
      )}
      onChange={(selectedWorkspace: string) => {
        if (!hasWorkspace) {
          setFieldValue(name, { name: workspaceName, workspace: selectedWorkspace });
        }
      }}
      fullWidth
      required={!optional}
    />
  );
};

export default TaskSidebarWorkspace;
