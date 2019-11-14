import * as React from 'react';
import { observer } from 'mobx-react';
import ElementContext from '../utils/ElementContext';
import { EventListener, isNode, Node } from '../types';
import { useDndDrag, WithDndDragProps, Modifiers } from './useDndDrag';
import { DragSourceSpec, DragEvent, ConnectDragSource, DragObjectWithType } from './dnd-types';
import { useDndManager } from './useDndManager';

export const DRAG_NODE_EVENT = 'drag_node';
export const DRAG_NODE_START_EVENT = `${DRAG_NODE_EVENT}_start`;
export const DRAG_NODE_END_EVENT = `${DRAG_NODE_EVENT}_end`;

export type DragNodeEventListener = EventListener<[Node, DragEvent, string]>;

export const DRAG_MOVE_OPERATION = 'move.useDragNode';

const defaultOperation = {
  [Modifiers.DEFAULT]: DRAG_MOVE_OPERATION,
};

export const useDragNode = <
  DragObject extends DragObjectWithType = DragObjectWithType,
  DropResult = any,
  CollectedProps extends {} = {},
  Props extends {} = {}
>(
  spec?: Omit<DragSourceSpec<DragObject, DropResult, CollectedProps, Props>, 'item'> & {
    item?: DragObject;
  },
  props?: Props,
): [CollectedProps, ConnectDragSource] => {
  const element = React.useContext(ElementContext);
  if (!isNode(element)) {
    throw new Error('useDragNode must be used within the scope of a Node');
  }
  const elementRef = React.useRef(element);
  elementRef.current = element;

  const dndManager = useDndManager();

  return useDndDrag(
    React.useMemo(() => {
      const sourceSpec: DragSourceSpec<any, any, any, Props> = {
        item: (spec && spec.item) || { type: '#useDragNode#' },
        operation: (() => {
          if (
            spec &&
            typeof spec.operation === 'object' &&
            Object.keys(spec.operation).length > 0
          ) {
            return {
              ...defaultOperation,
              ...spec.operation,
            };
          }
          return defaultOperation;
        })(),
        begin: (monitor, p) => {
          elementRef.current.raise();
          if (elementRef.current.isGroup()) {
            elementRef.current.getChildren().forEach((c) => {
              c.raise();
            });
          }

          const result = spec && spec.begin && spec.begin(monitor, p);

          elementRef.current
            .getController()
            .fireEvent(
              DRAG_NODE_START_EVENT,
              elementRef.current,
              monitor.getDragEvent(),
              monitor.getOperation(),
            );

          return result || elementRef.current;
        },
        drag: (event, monitor, p) => {
          const { dx, dy } = event;

          function moveElement(e: Node) {
            let moved = true;
            if (e.isGroup()) {
              const nodeChildren = e.getChildren().filter(isNode);
              if (nodeChildren.length) {
                moved = false;
                nodeChildren.forEach(moveElement);
              }
            }
            if (moved) {
              e.setBounds(
                e
                  .getBounds()
                  .clone()
                  .translate(dx, dy),
              );
            }
          }

          moveElement(elementRef.current);

          spec && spec.drag && spec.drag(event, monitor, p);

          elementRef.current
            .getController()
            .fireEvent(DRAG_NODE_EVENT, elementRef.current, event, monitor.getOperation());
        },
        canDrag: spec ? spec.canDrag : undefined,
        end: async (dropResult, monitor, p) => {
          if (spec && spec.end) {
            try {
              await spec.end(dropResult, monitor, p);
            } catch {
              dndManager.cancel();
            }
          }

          elementRef.current
            .getController()
            .fireEvent(
              DRAG_NODE_END_EVENT,
              elementRef.current,
              monitor.getDragEvent(),
              monitor.getOperation(),
            );
        },
        collect: spec ? spec.collect : undefined,
        canCancel: spec ? spec.canCancel : true,
      };
      return sourceSpec;
    }, [spec, dndManager]),
    props,
  );
};

export type WithDragNodeProps = {
  dragNodeRef: WithDndDragProps['dndDragRef'];
};

export const withDragNode = <
  DragObject extends DragObjectWithType = DragObjectWithType,
  DropResult = any,
  CollectedProps extends {} = {},
  Props extends {} = {}
>(
  spec?: Omit<DragSourceSpec<DragObject, DropResult, CollectedProps, Props>, 'item'> & {
    item?: DragObject;
  },
) => <P extends WithDragNodeProps & CollectedProps & Props>(
  WrappedComponent: React.ComponentType<P>,
) => {
  const Component: React.FC<Omit<P, keyof WithDragNodeProps>> = (props) => {
    // TODO fix cast to any
    const [dragNodeProps, dragNodeRef] = useDragNode(spec, props as any);
    return <WrappedComponent {...props as any} dragNodeRef={dragNodeRef} {...dragNodeProps} />;
  };
  return observer(Component);
};
