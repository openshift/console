import type { ReactNode, FC } from 'react';
import { useState, useEffect } from 'react';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';

import { NamespaceBarProps, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { ALL_NAMESPACES_KEY } from '@console/dynamic-plugin-sdk/src/constants';
import {
  ALL_APPLICATIONS_KEY,
  FLAGS,
  KEYBOARD_SHORTCUTS,
} from '@console/shared/src/constants/common';
import { NamespaceDropdown } from '@console/shared/src/components/namespace/NamespaceDropdown';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { k8sGet } from '@console/internal/module/k8s';
import { setFlag } from '../actions/flags';
import { NamespaceModel, ProjectModel } from '../models';
import { flagPending } from '../reducers/features';
import { Firehose } from './utils/firehose';
import { FirehoseResult } from './utils/types';
import { useQueryParamsMutator } from './utils/router';
import { useCreateNamespaceOrProjectModal } from '@console/shared/src/hooks/useCreateNamespaceOrProjectModal';
import type { RootState } from '../redux';
import { setActiveApplication } from '../actions/ui';

export type NamespaceBarDropdownsProps = {
  children: ReactNode;
  isDisabled: boolean;
  namespace?: FirehoseResult;
  onNamespaceChange: (namespace: string) => void;
  useProjects: boolean;
};

const getModel = (useProjects) => (useProjects ? ProjectModel : NamespaceModel);

export const NamespaceBarDropdowns: FC<NamespaceBarDropdownsProps> = ({
  children,
  isDisabled,
  namespace,
  onNamespaceChange,
  useProjects,
}) => {
  const { removeQueryArgument } = useQueryParamsMutator();
  const createNamespaceOrProjectModal = useCreateNamespaceOrProjectModal();
  const dispatch = useDispatch();
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();
  const activePerspective = useActivePerspective()[0];
  const [activeNamespaceError, setActiveNamespaceError] = useState(false);
  const canListNS = useFlag(FLAGS.CAN_LIST_NS);
  useEffect(() => {
    if (namespace.loaded) {
      dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, _.isEmpty(namespace.data)));
    }
  }, [dispatch, namespace.data, namespace.loaded]);

  /* Check if the activeNamespace is present in the cluster */
  useEffect(() => {
    if (activePerspective === 'dev' && activeNamespace !== ALL_NAMESPACES_KEY) {
      k8sGet(useProjects ? ProjectModel : NamespaceModel, activeNamespace)
        .then(() => {
          setActiveNamespace(activeNamespace);
          setActiveNamespaceError(false);
        })
        .catch((err) => {
          if (err?.response?.status === 404) {
            /* This would redirect to "/all-namespaces" to show the Project List */
            setActiveNamespace(ALL_NAMESPACES_KEY);
            setActiveNamespaceError(true);
          }
        });
    }
  }, [activeNamespace, activePerspective, setActiveNamespace, activeNamespaceError, useProjects]);

  if (flagPending(canListNS)) {
    return null;
  }

  return (
    <div className="co-namespace-bar__items" data-test-id="namespace-bar-dropdown">
      <NamespaceDropdown
        onSelect={(event, newNamespace) => {
          onNamespaceChange?.(newNamespace);
          setActiveNamespace(newNamespace);
          removeQueryArgument('project-name');
          activeNamespace !== newNamespace && dispatch(setActiveApplication(ALL_APPLICATIONS_KEY));
        }}
        onCreateNew={() => {
          createNamespaceOrProjectModal({
            onSubmit: (newProject) => {
              setActiveNamespace(newProject.metadata.name);
              removeQueryArgument('project-name');
            },
          });
        }}
        selected={!activeNamespaceError ? activeNamespace : ALL_NAMESPACES_KEY}
        isProjects={getModel(useProjects).label === 'Project'}
        disabled={isDisabled}
        shortCut={KEYBOARD_SHORTCUTS.focusNamespaceDropdown}
      />
      {children}
    </div>
  );
};

export const NamespaceBar: FC<NamespaceBarProps & { hideProjects?: boolean }> = ({
  onNamespaceChange,
  isDisabled,
  children,
  hideProjects = false,
}) => {
  const useProjects = useSelector<RootState, boolean>(({ k8s }) =>
    k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]),
  );
  return (
    <div className={css('co-namespace-bar', { 'co-namespace-bar--no-project': hideProjects })}>
      {hideProjects ? (
        <div className="co-namespace-bar__items" data-test-id="namespace-bar-dropdown">
          {children}
        </div>
      ) : (
        // Data from Firehose is not used directly by the NamespaceDropdown nor the children.
        // Data is used to determine if the StartGuide should be shown.
        // See NamespaceBarDropdowns_  above.
        <Firehose
          resources={[{ kind: getModel(useProjects).kind, prop: 'namespace', isList: true }]}
        >
          <NamespaceBarDropdowns
            useProjects={useProjects}
            isDisabled={isDisabled}
            onNamespaceChange={onNamespaceChange}
          >
            {children}
          </NamespaceBarDropdowns>
        </Firehose>
      )}
    </div>
  );
};
