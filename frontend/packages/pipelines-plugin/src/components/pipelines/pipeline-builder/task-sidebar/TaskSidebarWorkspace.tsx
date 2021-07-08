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

interface WorkspaceLink {
  name: string;
  workspace: string;
}

const TaskSidebarWorkspace: React.FC<TaskSidebarWorkspaceProps> = (props) => {
  const {
    availableWorkspaces,
    hasWorkspace,
    name,
    resourceWorkspace: { name: workspaceName, optional = false },
  } = props;
  const { t } = useTranslation();
  const { getFieldMeta, setFieldValue } = useFormikContext<PipelineBuilderFormikValues>();

  const dropdownWorkspaces = availableWorkspaces.filter((workspace) => !!workspace.name?.trim());

  const currentLinkedWorkspaceName = getFieldMeta<WorkspaceLink>(name).value?.workspace;
  const currentLinkedWorkspaceSelectable =
    currentLinkedWorkspaceName &&
    dropdownWorkspaces.some((resource) => resource.name === currentLinkedWorkspaceName);

  const options: FormSelectFieldOption[] = [
    {
      label: optional
        ? t('pipelines-plugin~No workspace')
        : t('pipelines-plugin~Select workspace...'),
      value: '',
      isPlaceholder: true,
      isDisabled: !optional,
    },
  ];
  if (currentLinkedWorkspaceName && !currentLinkedWorkspaceSelectable) {
    options.push({
      label: currentLinkedWorkspaceName,
      value: currentLinkedWorkspaceName,
      isDisabled: true,
    });
  }
  options.push(
    ...dropdownWorkspaces.map((workspace) => ({
      value: workspace.name,
      label: workspace.name,
    })),
  );

  return (
    <FormSelectField
      data-test={`workspaces ${workspaceName}`}
      name={`${name}.workspace`}
      label={workspaceName}
      isDisabled={options.length === 1}
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
