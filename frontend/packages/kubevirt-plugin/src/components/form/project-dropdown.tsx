import * as React from 'react';
import { FLAGS } from '@console/dynamic-plugin-sdk';
import { useFlag } from '@console/dynamic-plugin-sdk/src/shared/hooks/flag';
import { ListDropdown } from '@console/internal/components/utils';
import { NamespaceModel, ProjectModel } from '@console/internal/models';

type ProjectDropdownProps = {
  onChange: (project: string) => void;
  project: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  onChange,
  project,
  placeholder,
  disabled,
  id,
}) => {
  const useProjects = useFlag(FLAGS.OPENSHIFT);
  const kind = useProjects ? ProjectModel.kind : NamespaceModel.kind;
  return (
    <ListDropdown
      resources={[
        {
          kind,
        },
      ]}
      onChange={onChange}
      placeholder={`--- Select ${placeholder ? `${placeholder} ` : ''}${
        useProjects ? 'project' : 'namespace'
      } ---`}
      selectedKey={project}
      selectedKeyKind={kind}
      disabled={disabled}
      id={id}
    />
  );
};
