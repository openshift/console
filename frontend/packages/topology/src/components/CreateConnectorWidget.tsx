import * as React from 'react';
import { observer } from 'mobx-react';
import { DragEvent, DragSourceMonitor, DragSourceSpec } from '../behavior/dnd-types';
import { useDndDrag } from '../behavior/useDndDrag';
import { AnchorEnd, Graph, GraphElement, isGraph, isNode, Node } from '../types';
import Point from '../geom/Point';
import Layer from './layers/Layer';
import { hullPath } from '../utils';
import { ContextMenu, ContextMenuItem } from './contextmenu';

import './CreateConnectorWidget.scss';

export const CREATE_CONNECTOR_OPERATION = 'createconnector';
export const CREATE_CONNECTOR_DROP_TYPE = '#createConnector#';

const DEFAULT_HANDLE_ANGLE = 12 * (Math.PI / 180);
const DEFAULT_HANDLE_LENGTH = 32;

export type ConnectorChoice = {
  label: string;
};

export type CreateConnectorOptions = {
  handleAngle?: number;
  handleLength?: number;
};

export type CreateConnectorRendererProps = {
  startPoint: Point;
  endPoint: Point;
  dragging: boolean;
  hints: string[] | undefined;
  tipContents?: React.ReactNode;
  className?: string;
};

export type CreateConnectorRenderer = React.ComponentType<CreateConnectorRendererProps>;

type CreateConnectorWidgetProps = {
  element: Node;
  onKeepAlive: (isAlive: boolean) => void;
  onCreate: (
    element: Node,
    target: Node | Graph,
    event: DragEvent,
    choice?: ConnectorChoice,
  ) => ConnectorChoice[] | void | undefined | null | React.ReactElement[];
  ConnectorComponent: CreateConnectorRenderer;
  contextMenuClass?: string;
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
  choices: (ConnectorChoice | React.ReactElement)[];
};

export const CreateConnectorWidget: React.FC<CreateConnectorWidgetProps> = observer((props) => {
  const {
    element,
    onKeepAlive,
    onCreate,
    ConnectorComponent,
    handleAngle = DEFAULT_HANDLE_ANGLE,
    handleLength = DEFAULT_HANDLE_LENGTH,
    contextMenuClass,
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
          className="topology-create-connector"
          ref={dragRef}
          onMouseEnter={!active ? () => onKeepAlive(true) : undefined}
          onMouseLeave={!active ? () => onKeepAlive(false) : undefined}
        >
          <ConnectorComponent
            startPoint={startPoint}
            endPoint={endPoint}
            dragging={dragging}
            hints={hintsRef.current}
          />
          {!active && (
            <path
              d={hullPath(
                [
                  [startPoint.x, startPoint.y],
                  [endPoint.x, endPoint.y],
                ],
                7,
              )}
              fillOpacity="0"
            />
          )}
        </g>
      </Layer>
      {prompt && (
        <ContextMenu
          reference={{ x: prompt.event.pageX, y: prompt.event.pageY }}
          className={contextMenuClass}
          open
          onRequestClose={() => {
            setActive(false);
            onKeepAlive(false);
          }}
        >
          {React.isValidElement(prompt.choices?.[0])
            ? prompt.choices
            : prompt.choices.map((c: ConnectorChoice) => (
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
