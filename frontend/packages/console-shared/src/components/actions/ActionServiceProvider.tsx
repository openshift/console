import * as React from 'react';
import * as _ from 'lodash';
import { Action, ActionGroup, isActionGroup } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';
import { useDeepCompareMemoize } from '../../hooks';
import ActionsLoader from './loader/ActionsLoader';
import { ActionContext, ActionService, MenuOption } from './types';
import { createMenuOptions } from './utils';

type ActionServiceProviderProps = {
  context: ActionContext;
  children: (service: ActionService) => React.ReactNode;
};

const ActionServiceProvider: React.FC<ActionServiceProviderProps> = ({ context, children }) => {
  const [contextMap, setContextMap] = React.useState<ActionContext>(context);
  const [actionsMap, setActionsMap] = React.useState<{ [uid: string]: Action[] }>({});
  const [loadError, setLoadError] = React.useState<any>();

  const memoizedContext = useDeepCompareMemoize(context, true);

  const onContextChange = React.useCallback((newContexId: string, newScope: any) => {
    setContextMap((prevContext) => ({ ...prevContext, [newContexId]: newScope }));
  }, []);

  const onActionsLoaded = React.useCallback((actions: Action[], uid: string) => {
    setActionsMap((prev) => ({ ...prev, [uid]: actions }));
  }, []);

  const actions: Action[] = React.useMemo(() => _.flatten(Object.values(actionsMap)), [actionsMap]);

  const groupExtensions = useExtensions<ActionGroup>(isActionGroup);

  const options: MenuOption[] = React.useMemo(() => createMenuOptions(actions, groupExtensions), [
    actions,
    groupExtensions,
  ]);

  const actionsLoaded = Object.keys(contextMap).every((contextId) => actionsMap[contextId]);

  const service: ActionService = React.useMemo(
    () => ({
      actions,
      options,
      loaded: actionsLoaded,
      error: loadError,
    }),
    [actions, actionsLoaded, loadError, options],
  );

  // Update the state whenever the context from props changes.
  React.useEffect(() => {
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
