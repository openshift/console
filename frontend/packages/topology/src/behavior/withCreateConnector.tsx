import * as React from 'react';
import { observer } from 'mobx-react';
import { hullPath } from '../utils/svg-utils';
import DefaultCreateConnector from '../components/DefaultCreateConnector';
import Point from '../geom/Point';
import Layer from '../components/layers/Layer';
import ContextMenu, { ContextMenuItem } from '../components/contextmenu/ContextMenu';
import { Node, isNode, AnchorEnd, GraphElement, isGraph, Graph } from '../types';
import { DragSourceSpec, DragSourceMonitor, DragEvent } from './dnd-types';
import { useDndDrag } from './useDndDrag';

export const CREATE_CONNECTOR_OPERATION = 'createconnector';

export type ConnectorChoice = {
  label: string;
};

type CreateConnectorOptions = {
  handleAngle?: number;
  handleLength?: number;
};

type CreateConnectorWidgetProps = {
  element: Node;
  onKeepAlive: (isAlive: boolean) => void;
  onCreate: (
    element: Node,
    target: Node | Graph,
    event: DragEvent,
    choice?: ConnectorChoice,
  ) => ConnectorChoice[] | void | undefined | null;
  renderConnector: ConnectorRenderer;
} & CreateConnectorOptions;

type CollectProps = {
  event?: DragEvent;
  dragging: boolean;
  hints?: string[] | undefined;
};

type PromptData = {
  element: Node;
  target: Node | Graph;
  event: DragEvent;
  choices: ConnectorChoice[];
};

export const CREATE_CONNECTOR_DROP_TYPE = '#createConnector#';

const DEFAULT_HANDLE_ANGLE = 12 * (Math.PI / 180);
const DEFAULT_HANDLE_LENGTH = 32;

const CreateConnectorWidget: React.FC<CreateConnectorWidgetProps> = observer((props) => {
  const {
    element,
    onKeepAlive,
    onCreate,
    renderConnector,
    handleAngle = DEFAULT_HANDLE_ANGLE,
    handleLength = DEFAULT_HANDLE_LENGTH,
  } = props;
  const [prompt, setPrompt] = React.useState<PromptData | null>(null);
  const [active, setActive] = React.useState(false);
  const hintsRef = React.useRef<string[] | undefined>();

  const spec = React.useMemo(() => {
    const dragSourceSpec: DragSourceSpec<any, any, CollectProps> = {
      item: { type: CREATE_CONNECTOR_DROP_TYPE },
      operation: CREATE_CONNECTOR_OPERATION,
      begin: (monitor: DragSourceMonitor, dragProps: CreateConnectorWidgetProps) => {
        setActive(true);
        return dragProps.element;
      },
      drag: (event: DragEvent, monitor: DragSourceMonitor, p: CreateConnectorWidgetProps) => {
        p.element.raise();
      },
      end: (
        dropResult: GraphElement,
        monitor: DragSourceMonitor,
        dragProps: CreateConnectorWidgetProps,
      ) => {
        const event = monitor.getDragEvent();
        if ((isNode(dropResult) || isGraph(dropResult)) && event) {
          const choices = dragProps.onCreate(dragProps.element, dropResult, event);
          if (choices && choices.length) {
            setPrompt({ element: dragProps.element, target: dropResult, event, choices });
            return;
          }
        }
        setActive(false);
        dragProps.onKeepAlive(false);
      },
      collect: (monitor) => ({
        dragging: !!monitor.getItem(),
        event: monitor.isDragging() ? monitor.getDragEvent() : undefined,
        hints: monitor.getDropHints(),
      }),
    };
    return dragSourceSpec;
  }, [setActive]);
  const [{ dragging, event, hints }, dragRef] = useDndDrag(spec, props);

  if (!active && dragging && !event) {
    // another connector is dragging right now
    return null;
  }

  if (dragging) {
    // store the latest hints
    hintsRef.current = hints;
  }

  const dragEvent = prompt ? prompt.event : event;

  let startPoint: Point;
  let endPoint: Point;

  if (dragEvent) {
    endPoint = new Point(dragEvent.x, dragEvent.y);
    startPoint = element.getAnchor(AnchorEnd.source).getLocation(endPoint);
  } else {
    const bounds = element.getBounds();
    const referencePoint = new Point(
      bounds.right(),
      Math.tan(handleAngle) * (bounds.width / 2) + bounds.y + bounds.height / 2,
    );
    startPoint = element.getAnchor(AnchorEnd.source).getLocation(referencePoint);
    endPoint = new Point(
      Math.cos(handleAngle) * handleLength + startPoint.x,
      Math.sin(handleAngle) * handleLength + startPoint.y,
    );
  }

  // bring into the coordinate space of the element
  element.translateFromParent(startPoint);
  element.translateFromParent(endPoint);

  return (
    <>
      <Layer id="top">
        <g
          ref={dragRef}
          onMouseEnter={!active ? () => onKeepAlive(true) : undefined}
          onMouseLeave={!active ? () => onKeepAlive(false) : undefined}
          style={{ cursor: !dragging ? 'pointer' : undefined }}
        >
          {renderConnector(startPoint, endPoint, hintsRef.current)}
          {!active && (
            <path
              d={hullPath([[startPoint.x, startPoint.y], [endPoint.x, endPoint.y]], 7)}
              fillOpacity="0"
            />
          )}
        </g>
      </Layer>
      {prompt && (
        <ContextMenu
          reference={{ x: prompt.event.pageX, y: prompt.event.pageY }}
          open
          onRequestClose={() => {
            setActive(false);
            onKeepAlive(false);
          }}
        >
          {prompt.choices.map((c) => (
            <ContextMenuItem
              key={c.label}
              onClick={() => {
                onCreate(prompt.element, prompt.target, prompt.event, c);
              }}
            >
              {c.label}
            </ContextMenuItem>
          ))}
        </ContextMenu>
      )}
    </>
  );
});

type ElementProps = {
  element: Node;
};

export type WithCreateConnectorProps = {
  onShowCreateConnector: () => void;
  onHideCreateConnector: () => void;
};

type ConnectorRenderer = <T extends any>(
  startPoint: Point,
  endPoint: Point,
  hints: string[] | undefined,
) => React.ReactElement;

const defaultRenderConnector: ConnectorRenderer = (
  startPoint: Point,
  endPoint: Point,
  hints?: string[] | undefined,
) => <DefaultCreateConnector startPoint={startPoint} endPoint={endPoint} hints={hints} />;

export const withCreateConnector = <P extends WithCreateConnectorProps & ElementProps>(
  onCreate: React.ComponentProps<typeof CreateConnectorWidget>['onCreate'],
  renderConnector: ConnectorRenderer = defaultRenderConnector,
  options?: CreateConnectorOptions,
) => (WrappedComponent: React.ComponentType<P>) => {
  const Component: React.FC<Omit<P, keyof WithCreateConnectorProps>> = (props) => {
    const [show, setShow] = React.useState(false);
    const [alive, setKeepAlive] = React.useState(false);
    const onShowCreateConnector = React.useCallback(() => setShow(true), []);
    const onHideCreateConnector = React.useCallback(() => setShow(false), []);
    const onKeepAlive = React.useCallback((isAlive: boolean) => setKeepAlive(isAlive), [
      setKeepAlive,
    ]);
    return (
      <>
        <WrappedComponent
          {...props as any}
          onShowCreateConnector={onShowCreateConnector}
          onHideCreateConnector={onHideCreateConnector}
        />
        {(show || alive) && (
          <CreateConnectorWidget
            {...options}
            element={props.element}
            onCreate={onCreate}
            onKeepAlive={onKeepAlive}
            renderConnector={renderConnector}
          />
        )}
      </>
    );
  };
  return observer(Component);
};
