import * as React from 'react';
import { observer } from 'mobx-react';
import { GraphElement as TopologyElement } from '../types';
import ElementContext from '../utils/ElementContext';
import ContextMenu from '../components/contextmenu/ContextMenu';
import Portal from '../components/contextmenu/Portal';

type Reference = React.ComponentProps<typeof ContextMenu>['reference'];

export type WithContextMenuProps = {
  onContextMenu: (e: React.MouseEvent) => void;
};

export const withContextMenu = <E extends TopologyElement>(
  actions: (element: E) => React.ReactElement[],
  container?: React.ComponentProps<typeof Portal>['container'],
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

    return (
      <>
        <WrappedComponent {...props as any} onContextMenu={onContextMenu} />
        {reference ? (
          <ContextMenu
            reference={reference}
            container={container}
            className={className}
            open
            onRequestClose={() => setReference(null)}
          >
            {actions(element as E)}
          </ContextMenu>
        ) : null}
      </>
    );
  };
  return observer(Component);
};
