import * as React from 'react';
import * as _ from 'lodash';
import { Action, ActionGroup, isActionGroup } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';
import ActionsLoader from './loader/ActionsLoader';
import { MenuOption } from './menu/menu-types';
import { createMenuOptions } from './menu/menu-utils';

type ActionContext = {
  [contextId: string]: any;
};

type ActionService = { actions: Action[]; options: MenuOption[]; loaded: boolean; error: any };

type ActionServiceProviderProps = {
  context: ActionContext;
  children: (service: ActionService) => React.ReactNode;
};

const ActionServiceProvider: React.FC<ActionServiceProviderProps> = ({ context, children }) => {
  const [contextMap, setContextMap] = React.useState<ActionContext>(context);
  const [actionsMap, setActionsMap] = React.useState<{ [uid: string]: Action[] }>({});
  const [loadError, setLoadError] = React.useState<any>();

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
