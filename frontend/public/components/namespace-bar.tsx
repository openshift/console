import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';

import { NamespaceBarProps } from '@console/dynamic-plugin-sdk';
import {
  ALL_NAMESPACES_KEY,
  FLAGS,
  KEYBOARD_SHORTCUTS,
  NamespaceDropdown,
  useActiveNamespace,
  useFlag,
} from '@console/shared';

import { setFlag } from '../actions/features';
import { NamespaceModel, ProjectModel } from '../models';
import { flagPending } from '../reducers/features';
import { createProjectModal } from './modals';
import { Firehose, FirehoseResult, removeQueryArgument } from './utils';

export type NamespaceBarDropdownsProps = {
  children: React.ReactNode;
  isDisabled: boolean;
  namespace?: FirehoseResult;
  onNamespaceChange: (namespace: string) => void;
  useProjects: boolean;
};

const getModel = (useProjects) => (useProjects ? ProjectModel : NamespaceModel);

export const NamespaceBarDropdowns: React.FC<NamespaceBarDropdownsProps> = ({
  children,
  isDisabled,
  namespace,
  onNamespaceChange,
  useProjects,
}) => {
  const dispatch = useDispatch();
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();
  const canListNS = useFlag(FLAGS.CAN_LIST_NS);
  React.useEffect(() => {
    if (namespace.loaded) {
      dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, _.isEmpty(namespace.data)));
    }
  }, [dispatch, namespace.data, namespace.loaded]);

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
        }}
        onCreateNew={() => {
          createProjectModal({
            blocking: true,
            onSubmit: (newProject) => {
              setActiveNamespace(newProject.metadata.name);
              removeQueryArgument('project-name');
            },
          });
        }}
        selected={activeNamespace || ALL_NAMESPACES_KEY}
        isProjects={getModel(useProjects).label === 'Project'}
        disabled={isDisabled}
        shortCut={KEYBOARD_SHORTCUTS.focusNamespaceDropdown}
      />
      {children}
    </div>
  );
};

export const NamespaceBar: React.FC<NamespaceBarProps & { hideProjects?: boolean }> = ({
  onNamespaceChange,
  isDisabled,
  children,
  hideProjects = false,
}) => {
  const useProjects = useSelector(({ k8s }) =>
    k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]),
  );
  return (
    <div
      className={classNames('co-namespace-bar', { 'co-namespace-bar--no-project': hideProjects })}
    >
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
