import type {
  ComponentType,
  ReactElement,
  FunctionComponent,
  ComponentProps,
  ReactNode,
} from 'react';
import { isValidElement, useState, useRef, useMemo, useCallback } from 'react';
import { css } from '@patternfly/react-styles';
import {
  hullPath,
  DefaultCreateConnector,
  Point,
  Layer,
  ContextMenu,
  ContextMenuItem,
  AnchorEnd,
  Graph,
  GraphElement,
  isGraph,
  isNode,
  LabelPosition,
  Node,
  DragEvent,
  DragObjectWithType,
  DragOperationWithType,
  DragSourceMonitor,
  DragSourceSpec,
  DragSpecOperationType,
  useDndDrag,
  TOP_LAYER,
  useCombineRefs,
  useHover,
} from '@patternfly/react-topology';
import styles from '@patternfly/react-topology/dist/js/css/topology-components';
import { observer } from 'mobx-react';
import {
  ElementProps,
  WithCreateConnectorProps,
} from '@console/dynamic-plugin-sdk/src/extensions/topology-types';

//
// Local version of the @patternfly/react-topology withCreateConnector
// Updated to notify the wrapped component when the create connector is being dragged
//

export const CREATE_CONNECTOR_OPERATION = '#createconnector#';
export const CREATE_CONNECTOR_DROP_TYPE = '#createConnector#';

export interface ConnectorChoice {
  label: string;
}

export interface CreateConnectorOptions {
  handleAngle?: number;
  handleAngleTop?: number;
  handleLength?: number;
  dragItem?: DragObjectWithType;
  dragOperation?: DragOperationWithType;
  hideConnectorMenu?: boolean;
}

interface ConnectorComponentProps {
  startPoint: Point;
  endPoint: Point;
  hints: string[];
  dragging: boolean;
  hover?: boolean;
}

type CreateConnectorRenderer = ComponentType<ConnectorComponentProps>;

type OnCreateResult = ConnectorChoice[] | void | undefined | null | ReactElement[];

type CreateConnectorWidgetProps = {
  element: Node;
  onKeepAlive: (isAlive: boolean) => void;
  onCreate: (
    element: Node,
    target: Node | Graph,
    event: DragEvent,
    dropHints?: string[] | undefined,
    choice?: ConnectorChoice,
  ) => Promise<OnCreateResult> | OnCreateResult;
  ConnectorComponent: CreateConnectorRenderer;
  contextMenuClass?: string;
} & CreateConnectorOptions;

interface CollectProps {
  event?: DragEvent;
  dragging: boolean;
  hints?: string[] | undefined;
}

interface PromptData {
  element: Node;
  target: Node | Graph;
  event: DragEvent;
  choices: ConnectorChoice[] | ReactElement[];
}

const isReactElementArray = (
  choices: ConnectorChoice[] | ReactElement[],
): choices is ReactElement[] => isValidElement(choices[0]);

const DEFAULT_HANDLE_ANGLE = Math.PI / 180;
const DEFAULT_HANDLE_ANGLE_TOP = 1.5 * Math.PI;
const DEFAULT_HANDLE_LENGTH = 32;

const CreateConnectorWidget: FunctionComponent<CreateConnectorWidgetProps> = observer((props) => {
  const {
    element,
    onKeepAlive,
    onCreate,
    ConnectorComponent,
    handleAngle = DEFAULT_HANDLE_ANGLE,
    handleAngleTop = DEFAULT_HANDLE_ANGLE_TOP,
    handleLength = DEFAULT_HANDLE_LENGTH,
    contextMenuClass,
    dragItem,
    dragOperation,
    hideConnectorMenu,
  } = props;
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [active, setActive] = useState(false);
  const hintsRef = useRef<string[] | undefined>();

  const spec = useMemo(() => {
    const dragSourceSpec: DragSourceSpec<
      DragObjectWithType,
      DragSpecOperationType<DragOperationWithType>,
      GraphElement,
      CollectProps,
      CreateConnectorWidgetProps
    > = {
      item: dragItem || { type: CREATE_CONNECTOR_DROP_TYPE },
      operation: dragOperation || { type: CREATE_CONNECTOR_OPERATION },
      begin: (monitor: DragSourceMonitor, dragProps: any) => {
        setActive(true);
        return dragProps.element;
      },
      drag: (event: DragEvent, monitor: DragSourceMonitor, p: CreateConnectorWidgetProps) => {
        p.element.raise();
      },
      end: async (
        dropResult: GraphElement,
        monitor: DragSourceMonitor,
        dragProps: CreateConnectorWidgetProps,
      ) => {
        const event = monitor.getDragEvent();
        if ((isNode(dropResult) || isGraph(dropResult)) && event) {
          const choices = await dragProps.onCreate(
            dragProps.element,
            dropResult,
            event,
            monitor.getDropHints(),
          );
          if (choices && choices.length && !hideConnectorMenu) {
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
  }, [setActive, dragItem, dragOperation, hideConnectorMenu]);
  const [{ dragging, event, hints }, dragRef] = useDndDrag(spec, props);
  const [hover, hoverRef] = useHover();
  const refs = useCombineRefs(dragRef, hoverRef);

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
    const isRightLabel = element.getLabelPosition() === LabelPosition.right;
    const referencePoint = isRightLabel
      ? new Point(bounds.x + bounds.width / 2, bounds.y)
      : new Point(
          bounds.right(),
          Math.tan(handleAngle) * (bounds.width / 2) + bounds.y + bounds.height / 2,
        );
    startPoint = element.getAnchor(AnchorEnd.source).getLocation(referencePoint);
    endPoint = new Point(
      Math.cos(isRightLabel ? handleAngleTop : handleAngle) * handleLength + startPoint.x,
      Math.sin(isRightLabel ? handleAngleTop : handleAngle) * handleLength + startPoint.y,
    );
  }

  // bring into the coordinate space of the element
  element.translateFromParent(startPoint);
  element.translateFromParent(endPoint);

  const connector = (
    <g
      className={css(styles.topologyDefaultCreateConnector)}
      ref={refs}
      onMouseEnter={!active ? () => onKeepAlive(true) : undefined}
      onMouseLeave={!active ? () => onKeepAlive(false) : undefined}
    >
      <ConnectorComponent
        startPoint={startPoint}
        endPoint={endPoint}
        dragging={dragging}
        hints={hintsRef.current || []}
        hover={hover}
      />
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
    </g>
  );

  return (
    <>
      {active ? <Layer id={TOP_LAYER}>{connector}</Layer> : connector}
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
          {isReactElementArray(prompt.choices)
            ? prompt.choices
            : prompt.choices.map((c: ConnectorChoice) => (
                <ContextMenuItem
                  key={c.label}
                  onClick={() => {
                    onCreate(prompt.element, prompt.target, prompt.event, hintsRef.current, c);
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

export const withCreateConnector = <P extends WithCreateConnectorProps & ElementProps>(
  onCreate: ComponentProps<typeof CreateConnectorWidget>['onCreate'],
  ConnectorComponent: CreateConnectorRenderer = DefaultCreateConnector,
  contextMenuClass?: string,
  options?: CreateConnectorOptions,
) => (WrappedComponent: ComponentType<Partial<P>>) => {
  const Component: FunctionComponent<
    Omit<P, keyof WithCreateConnectorProps> & { children?: ReactNode }
  > = ({ children, ...props }) => {
    const [show, setShow] = useState(false);
    const [alive, setKeepAlive] = useState(false);
    const onShowCreateConnector = useCallback(() => setShow(true), []);
    const onHideCreateConnector = useCallback(() => setShow(false), []);
    const onKeepAlive = useCallback(
      (isAlive: boolean) => {
        setKeepAlive((prev) => {
          if (prev && !isAlive) {
            onHideCreateConnector();
          }
          return isAlive;
        });
      },
      [onHideCreateConnector],
    );
    return (
      <WrappedComponent
        {...(props as any)}
        onShowCreateConnector={onShowCreateConnector}
        onHideCreateConnector={onHideCreateConnector}
        createConnectorDrag={alive}
      >
        {children}
        {(show || alive) && (
          <CreateConnectorWidget
            {...options}
            element={props.element}
            onCreate={onCreate}
            onKeepAlive={onKeepAlive}
            ConnectorComponent={ConnectorComponent}
            contextMenuClass={contextMenuClass}
          />
        )}
      </WrappedComponent>
    );
  };
  Component.displayName = `withCreateConnector(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return observer(Component);
};
