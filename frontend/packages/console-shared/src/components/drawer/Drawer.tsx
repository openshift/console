import * as React from 'react';
import { CSSTransition } from 'react-transition-group';
import { DraggableData, DraggableCore } from 'react-draggable';
import './Drawer.scss';

type DrawerProps = {
  /**
   * Height of the drawer,
   * should be set when used as controlled component with onChange callback
   */
  height?: number;
  /**
   * Default Value: 300
   * default height of the drawer component,
   * should be set when used as Uncontrolled component
   */
  defaultHeight?: number;
  /**
   * Defines the minimized state of drawer
   * false: Height is minimum height (minimized state)
   * true: Height is greater than minimum height
   */
  open?: boolean;
  /**
   * Maximum height drawer can be resized to.
   */
  maxHeight?: number | string;
  /**
   * Set whether the drawer is resizable or not.
   */
  resizable?: boolean;
  /**
   * Content for the Header of drawer
   */
  header?: React.ReactNode;
  /**
   * This callback is invoked while resizing the drawer.
   * @param open boolean: false when the drawer reached minimum height (minimized state)
   * @param height number: Height of the drawer while resizing
   */
  onChange?: (open: boolean, height: number) => void;
};

const useSize = <T extends HTMLElement>(): [number, (element: T) => void] => {
  const [height, setHeight] = React.useState<number>(0);

  const callback = React.useCallback((element: T): void => {
    if (element) {
      const bb = element.getBoundingClientRect();
      setHeight(bb.height);
    }
  }, []);
  return [height, callback];
};

const Drawer: React.FC<DrawerProps> = ({
  children,
  defaultHeight = 300,
  height,
  maxHeight = '100%',
  open = true,
  resizable = false,
  header,
  onChange,
}) => {
  const [heightState, setHeightState] = React.useState(defaultHeight);
  const lastObservedHeightRef = React.useRef<number>(0);
  const [minHeight, headerRef] = useSize<HTMLDivElement>();
  const resizeHeight = height ?? heightState;
  const minimumHeight = minHeight ?? 0;
  const handleDrag = (e: MouseEvent, data: DraggableData) => {
    const newHeight = resizeHeight - data.y;
    if (onChange) {
      if (newHeight > minimumHeight) {
        onChange(true, newHeight);
      } else {
        onChange(false, minimumHeight);
      }
    } else {
      setHeightState(newHeight);
    }
  };

  const handleResizeStart = (e: MouseEvent, data: DraggableData) => {
    lastObservedHeightRef.current = resizeHeight;
    const newHeight = resizeHeight - data.y;
    // if the drawer is in minimized state and drag started then
    // reset the lastObservedHeight to minimumHeight
    if (onChange && !open && newHeight > minimumHeight) {
      onChange(false, minimumHeight);
    }
  };

  const handleResizeStop = (e: MouseEvent, data: DraggableData) => {
    const newHeight = resizeHeight - data.y;
    if (onChange && newHeight <= minimumHeight) {
      onChange(false, lastObservedHeightRef.current);
    }
  };
  const draggable = resizable && (
    <DraggableCore onDrag={handleDrag} onStart={handleResizeStart} onStop={handleResizeStop}>
      <div className="ocs-drawer__drag-handle" />
    </DraggableCore>
  );
  return (
    <CSSTransition appear in timeout={225} classNames="ocs-drawer">
      <div
        className="ocs-drawer"
        style={{
          height: open ? resizeHeight : minimumHeight,
          maxHeight,
          minHeight: minimumHeight,
        }}
      >
        {draggable}
        <div ref={headerRef} className="ocs-drawer__header">
          {header}
        </div>
        <div className="ocs-drawer__body">{children}</div>
      </div>
    </CSSTransition>
  );
};

export default Drawer;
