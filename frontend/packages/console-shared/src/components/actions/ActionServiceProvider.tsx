import type { FC } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import * as _ from 'lodash';
import type {
  Action,
  ActionGroup,
  ActionService,
  ActionServiceProviderProps,
  MenuOption,
} from '@console/dynamic-plugin-sdk';
import { isActionGroup } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { useDeepCompareMemoize } from '../../hooks/useDeepCompareMemoize';
import ActionsLoader from './loader/ActionsLoader';
import type { ActionContext } from './types';
import { createMenuOptions } from './utils';

const ActionServiceProvider: FC<ActionServiceProviderProps> = ({ context, children }) => {
  const [contextMap, setContextMap] = useState<ActionContext>(context);
  const [actionsMap, setActionsMap] = useState<{ [uid: string]: Action[] }>({});
  const [loadError, setLoadError] = useState<any>();

  const memoizedContext = useDeepCompareMemoize(context);

  const onContextChange = useCallback((newContexId: string, newScope: any) => {
    setContextMap((prevContext) => ({ ...prevContext, [newContexId]: newScope }));
  }, []);

  const onActionsLoaded = useCallback((actions: Action[], uid: string) => {
    setActionsMap((prev) => ({ ...prev, [uid]: actions }));
  }, []);

  const actions: Action[] = useMemo(() => _.flatten(Object.values(actionsMap)), [actionsMap]);

  const groupExtensions = useExtensions<ActionGroup>(isActionGroup);

  const options: MenuOption[] = useMemo(() => createMenuOptions(actions, groupExtensions), [
    actions,
    groupExtensions,
  ]);

  const actionsLoaded = Object.keys(contextMap).every((contextId) => actionsMap[contextId]);

  const service: ActionService = useMemo(
    () => ({
      actions,
      options,
      loaded: actionsLoaded,
      error: loadError,
    }),
    [actions, actionsLoaded, loadError, options],
  );

  // Update the state whenever the context from props changes.
  useEffect(() => {
    setContextMap((prevContext) => ({ ...prevContext, ...memoizedContext }));
  }, [memoizedContext]);

  return (
    <>
      {Object.keys(contextMap).map((contextId) => (
        <ActionsLoader
          key={contextId}
          contextId={contextId}
          scope={contextMap[contextId]}
          onActionsLoaded={(value) => onActionsLoaded(value, contextId)}
          onContextChange={onContextChange}
          onLoadError={setLoadError}
        />
      ))}
      {children(service)}
    </>
  );
};

export default ActionServiceProvider;
