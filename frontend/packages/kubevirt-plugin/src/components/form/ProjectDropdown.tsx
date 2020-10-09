import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { FLAGS, ALL_NAMESPACES_KEY } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { ProjectModel, NamespaceModel } from '@console/internal/models';
import { ListDropdown } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';

type ProjectDropdownProps = {
  onChange: (project: string) => void;
  project: string;
  placeholder?: string;
};

const ProjectDropdown: React.FC<ProjectDropdownProps> = ({ onChange, project, placeholder }) => {
  const useProjects = useFlag(FLAGS.OPENSHIFT);
  const activeNamespace = useSelector(getActiveNamespace);
  let initialProject = project;
  if (activeNamespace !== ALL_NAMESPACES_KEY && !project && project !== activeNamespace) {
    initialProject = activeNamespace;
    onChange(initialProject);
  }
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
      selectedKey={initialProject}
      selectedKeyKind={kind}
    />
  );
};

export default ProjectDropdown;
