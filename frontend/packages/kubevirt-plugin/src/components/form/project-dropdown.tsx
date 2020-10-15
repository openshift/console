import * as React from 'react';
import { FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { ProjectModel, NamespaceModel } from '@console/internal/models';
import { ListDropdown } from '@console/internal/components/utils';

type ProjectDropdownProps = {
  onChange: (project: string) => void;
  project: string;
  placeholder?: string;
};

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  onChange,
  project,
  placeholder,
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
    />
  );
};
