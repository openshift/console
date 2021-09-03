import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { createProjectModal } from '@console/internal/components/modals';
import { useProjectOrNamespaceModel } from '@console/internal/components/utils';
import { ProjectModel } from '@console/internal/models';
import { K8sKind } from '@console/internal/module/k8s/types';
import NamespaceDropdown from '@console/shared/src/components/namespace/NamespaceDropdown';
import { usePreferredNamespace } from './usePreferredNamespace';

import './UserPreferenceNamespaceDropdown.scss';

const UserPreferenceNamespaceDropdown: React.FC = () => {
  const { t } = useTranslation();
  const [
    preferredNamespace,
    setPreferredNamespace,
    preferredNamespaceLoaded,
  ] = usePreferredNamespace();

  const [model] = useProjectOrNamespaceModel() as [K8sKind, boolean];
  const isProjects: boolean = model?.kind === ProjectModel.kind;

  const lastViewedLabel: string = t('console-app~Last viewed');
  const lastViewedKey: string = '#LATEST#';

  const customOption = {
    items: [
      {
        key: lastViewedKey,
        title: lastViewedLabel,
      },
    ],
  };

  const onSelect = (_, selection: string) => {
    const selectedValue: string = selection === lastViewedKey ? null : selection;
    if (selectedValue !== preferredNamespace) {
      setPreferredNamespace(selectedValue);
    }
  };

  const onCreateNew = () => {
    createProjectModal({
      blocking: true,
      onSubmit: (newProject) => {
        setPreferredNamespace(newProject.metadata.name);
      },
    });
  };

  return preferredNamespaceLoaded ? (
    <div className="co-namespace-preference__dropdown">
      <NamespaceDropdown
        isProjects={isProjects}
        onSelect={onSelect}
        selected={preferredNamespace || lastViewedLabel}
        customOptions={[customOption]}
        onCreateNew={onCreateNew}
        data-test="dropdown console.preferredNamespace"
      />
    </div>
  ) : (
    <Skeleton height="30px" width="100%" data-test="dropdown skeleton console.preferredNamespace" />
  );
};

export default UserPreferenceNamespaceDropdown;
