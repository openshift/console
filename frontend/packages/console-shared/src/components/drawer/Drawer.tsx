import * as React from 'react';
import { CSSTransition } from 'react-transition-group';
import { DraggableEvent } from 'react-draggable';
import DraggableCoreIFrameFix from './DraggableCoreIFrameFix';
import './Drawer.scss';

type DrawerProps = {
  /**
   * Controlled height of the drawer.
   * Should be set when used as controlled component with onChange callback.
   */
  height?: number;
  /**
   * Default Value: 300
   * Uncontrolled default height of the drawer.
   */
  defaultHeight?: number;
  /**
   * Toggles controlled open state.
   */
  open?: boolean;
  /**
   * Default Value: true
   * Uncontrolled open state of the drawer on first render.
   */
  defaultOpen?: boolean;
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

// get the pageX value from a mouse or touch event
const getPageY = (e: DraggableEvent): number =>
  (e as MouseEvent).pageY ?? (e as TouchEvent).touches?.[0]?.pageY;

const Drawer: React.FC<DrawerProps> = ({
  children,
  defaultHeight = 300,
  height,
  maxHeight = '100%',
  open,
  defaultOpen = true,
  resizable = false,
  header,
  onChange,
}) => {
  const drawerRef = React.useRef<HTMLDivElement>();
  const [heightState, setHeightState] = React.useState(defaultHeight);
  const [openState, setOpenState] = React.useState(defaultOpen);
  const lastObservedHeightRef = React.useRef<number>();
  const startRef = React.useRef<number>();
  const [minHeight, headerRef] = useSize<HTMLDivElement>();
  const minimumHeight = minHeight ?? 0;

  // merge controlled and uncontrolled states
  const currentOpen = open ?? openState;
  const currentHeight = height ?? heightState;

  const setHeight = (drawerHeight: number, forceOpen?: boolean) => {
    const newHeight = Math.max(drawerHeight, minimumHeight);
    const newOpen = forceOpen ?? newHeight > minimumHeight;
    setHeightState(newHeight);
    setOpenState(newOpen);
    if (onChange) {
      onChange(newOpen, newHeight);
    }
  };

  const handleDrag = (e: DraggableEvent) => {
    setHeight(startRef.current - getPageY(e));
  };

  const handleResizeStart = (e: DraggableEvent) => {
    lastObservedHeightRef.current = currentHeight;
    // always start with actual drawer height
    const drawerHeight = drawerRef.current?.offsetHeight || currentHeight;
    startRef.current = drawerHeight + getPageY(e);
    if (drawerHeight !== currentHeight) {
      setHeight(drawerHeight);
    }
  };

  const handleResizeStop = () => {
    if (currentHeight <= minimumHeight) {
      setHeight(lastObservedHeightRef.current, false);
    }
  };

  const draggable = resizable && (
    <DraggableCoreIFrameFix
      onDrag={handleDrag}
      onStart={handleResizeStart}
      onStop={handleResizeStop}
    >
      <div className="ocs-drawer__drag-handle" />
    </DraggableCoreIFrameFix>
  );
  return (
    <CSSTransition appear in timeout={225} classNames="ocs-drawer">
      <div
        ref={drawerRef}
        className="ocs-drawer"
        style={{
          height: currentOpen ? currentHeight : minimumHeight,
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
