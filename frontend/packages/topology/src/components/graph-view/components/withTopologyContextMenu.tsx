import type { ComponentProps, MouseEvent, ComponentType, FC } from 'react';
import { useContext, useState, useCallback, useMemo } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { ElementContext, ContextMenu } from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import type { ActionContext } from '@console/shared';
import { ActionServiceProvider } from '@console/shared';
import { createContextMenuItems } from '../../../actions';

type Reference = ComponentProps<typeof ContextMenu>['reference'];

export interface WithContextMenuProps {
  onContextMenu: (e: MouseEvent) => void;
  contextMenuOpen: boolean;
}

const withContextMenu = <E extends GraphElement>(
  actionContext: (element: E) => ActionContext,
  container?: Element | null | undefined | (() => Element),
  className?: string,
  atPoint: boolean = true,
) => <P extends WithContextMenuProps>(WrappedComponent: ComponentType<Partial<P>>) => {
  const Component: FC<Omit<P, keyof WithContextMenuProps>> = (props) => {
    const element = useContext(ElementContext);
    const [reference, setReference] = useState<Reference | null>(null);
    const onContextMenu = useCallback((e: MouseEvent) => {
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

    // Memoize the action context to prevent unnecessary re-renders of ActionServiceProvider
    // Only recompute when the context menu is opened (reference changes from null to a value)
    const memoizedActionContext = useMemo(
      () => (reference ? actionContext(element as E) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [!!reference],
    );

    return (
      <>
        <WrappedComponent
          {...(props as any)}
          onContextMenu={onContextMenu}
          contextMenuOpen={!!reference}
        />
        {memoizedActionContext ? (
          <ActionServiceProvider context={memoizedActionContext}>
            {({ options, loaded }) =>
              loaded ? (
                <ContextMenu
                  reference={reference}
                  container={container}
                  className={className}
                  open
                  onRequestClose={() => setReference(null)}
                >
                  {createContextMenuItems(options)}
                </ContextMenu>
              ) : null
            }
          </ActionServiceProvider>
        ) : null}
      </>
    );
  };
  Component.displayName = `withContextMenu(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return observer(Component);
};

export default withContextMenu;
