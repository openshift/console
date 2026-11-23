import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import useActivePerspective from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';
import { setActiveApplication } from '@console/internal/actions/ui';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useQueryParamsMutator } from '@console/shared/src/hooks/useQueryParamsMutator';
import { useMountedNamespaceBar } from './mounted-namespace-bar';
import type { CommandPaletteCommand } from './types';

export const useRunCommand = (): ((command: CommandPaletteCommand) => void) => {
  const navigate = useNavigate();
  const dispatch = useConsoleDispatch();
  const { removeQueryArgument } = useQueryParamsMutator();
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();
  const namespaceBar = useMountedNamespaceBar();

  return useCallback(
    (command: CommandPaletteCommand) => {
      switch (command.type) {
        case 'page':
          if (command.perspective === activePerspective) {
            navigate(command.href);
          } else {
            setActivePerspective(command.perspective, command.href);
          }
          break;

        case 'resource':
          navigate(command.href);
          break;

        case 'namespace':
          removeQueryArgument('project-name');
          namespaceBar?.onNamespaceChange?.(command.namespace);
          setActiveNamespace(command.namespace);

          if (activeNamespace !== command.namespace) {
            dispatch(setActiveApplication(ALL_APPLICATIONS_KEY));
          }
          break;

        default:
          break;
      }
    },
    [
      activeNamespace,
      activePerspective,
      dispatch,
      namespaceBar,
      navigate,
      removeQueryArgument,
      setActiveNamespace,
      setActivePerspective,
    ],
  );
};
