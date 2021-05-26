import * as React from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { FormSelectField, FormSelectFieldOption } from '@console/shared';
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

  const dropdownWorkspaces = availableWorkspaces.filter((workspace) => !!workspace.name?.trim());

  const options: FormSelectFieldOption[] = [
    {
      label: t('pipelines-plugin~Select workspace...'),
      value: '',
      isPlaceholder: true,
    },
    ...dropdownWorkspaces.map((workspace) => ({
      value: workspace.name,
      label: workspace.name,
    })),
  ];

  return (
    <FormSelectField
      name={`${name}.workspace`}
      label={workspaceName}
      isDisabled={dropdownWorkspaces.length === 0}
      options={options}
      onChange={(selectedWorkspace: string) => {
        if (!hasWorkspace) {
          setFieldValue(name, { name: workspaceName, workspace: selectedWorkspace });
        }
      }}
      required={!optional}
    />
  );
};

export default TaskSidebarWorkspace;
