import * as React from 'react';
import { observer } from 'mobx-react';
import { useExtensions, KebabActionFactory, isKebabActionFactory } from '@console/plugin-sdk';
import {} from '@console/topology/';
import { GraphElement as TopologyElement } from '../types';
import ElementContext from '../utils/ElementContext';
import ContextMenu from '../components/contextmenu/ContextMenu';

type Reference = React.ComponentProps<typeof ContextMenu>['reference'];

type ActionsCreator<E extends TopologyElement> = (
  element: E,
  options?: { actionExtensions?: KebabActionFactory[] },
) => React.ReactElement[];

export type WithContextMenuProps = {
  onContextMenu: (e: React.MouseEvent) => void;
  contextMenuOpen: boolean;
};

export const withContextMenu = <E extends TopologyElement>(
  actions: ActionsCreator<E>,
  container?: Element | null | undefined | (() => Element),
  className?: string,
  atPoint: boolean = true,
) => <P extends WithContextMenuProps>(WrappedComponent: React.ComponentType<P>) => {
  const Component: React.FC<Omit<P, keyof WithContextMenuProps>> = (props) => {
    const element = React.useContext(ElementContext);
    const [reference, setReference] = React.useState<Reference | null>(null);
    const onContextMenu = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setReference(
        atPoint
          ? {
              x: e.pageX,
              y: e.pageY,
            }
          : e.currentTarget,
      );
    }, []);
    const actionExtensions = useExtensions<KebabActionFactory>(isKebabActionFactory);
    const menuItems = actions(element as E, { actionExtensions });

    return (
      <>
        <WrappedComponent
          {...(props as any)}
          onContextMenu={onContextMenu}
          contextMenuOpen={!!reference}
        />
        {reference ? (
          <ContextMenu
            reference={reference}
            container={container}
            className={className}
            open
            onRequestClose={() => setReference(null)}
          >
            {menuItems}
          </ContextMenu>
        ) : null}
      </>
    );
  };

  return observer(Component);
};
