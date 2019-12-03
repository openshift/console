import * as React from 'react';
import PopperJS, { PopperOptions } from 'popper.js';
import { useCombineRefs } from '../../utils/useCombineRefs';
import Portal from './Portal';

// alignment with PopperJS reference API
type PopperJSReference = {
  getBoundingClientRect: PopperJS['reference']['getBoundingClientRect'];
  clientWidth: number;
  clientHeight: number;
};

type ClientRectProp = { x: number; y: number; width?: number; height?: number };

type Reference = Element | PopperJSReference | ClientRectProp;

class VirtualReference implements PopperJSReference {
  private rect: ClientRect;

  constructor({ height = 0, width = 0, x, y }: ClientRectProp) {
    this.rect = {
      bottom: y + height,
      height,
      left: x,
      right: x + width,
      top: y,
      width,
    };
  }

  getBoundingClientRect(): ClientRect {
    return this.rect;
  }

  get clientWidth(): number {
    return this.rect.width || 0;
  }

  get clientHeight(): number {
    return this.rect.height || 0;
  }
}

const getReference = (reference: Reference): PopperJSReference =>
  'getBoundingClientRect' in reference ? reference : new VirtualReference(reference);

type PopperProps = {
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  container?: React.ComponentProps<typeof Portal>['container'];
  className?: string;
  open?: boolean;
  onRequestClose?: (e?: MouseEvent) => void;
  placement?:
    | 'bottom-end'
    | 'bottom-start'
    | 'bottom'
    | 'left-end'
    | 'left-start'
    | 'left'
    | 'right-end'
    | 'right-start'
    | 'right'
    | 'top-end'
    | 'top-start'
    | 'top';
  popperOptions?: PopperOptions;
  popperRef?: React.Ref<PopperJS>;
  reference: Reference | (() => Reference);
  zIndex?: number;
};

const DEFAULT_POPPER_OPTIONS: PopperOptions = {};

const Popper: React.FC<PopperProps> = ({
  children,
  container,
  className,
  open,
  placement = 'bottom-start',
  reference,
  popperOptions = DEFAULT_POPPER_OPTIONS,
  closeOnEsc,
  closeOnOutsideClick,
  onRequestClose,
  popperRef: popperRefIn,
  zIndex = 9999,
}) => {
  const controlled = typeof open === 'boolean';
  const openProp = controlled ? open : true;
  const nodeRef = React.useRef<Element>();
  const popperRef = React.useRef<PopperJS>(null);
  const popperRefs = useCombineRefs<PopperJS>(popperRef, popperRefIn);
  const [isOpen, setOpen] = React.useState(openProp);

  React.useEffect(() => {
    setOpen(openProp);
  }, [openProp]);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.keyCode === 27) {
        controlled ? onRequestClose && onRequestClose() : setOpen(false);
      }
    },
    [onRequestClose, controlled],
  );

  const onClickOutside = React.useCallback(
    (e: MouseEvent) => {
      if (!nodeRef.current || (e.target instanceof Node && !nodeRef.current.contains(e.target))) {
        controlled ? onRequestClose && onRequestClose(e) : setOpen(false);
      }
    },
    [onRequestClose, controlled],
  );

  const destroy = React.useCallback(() => {
    if (popperRef.current) {
      popperRef.current.destroy();
      popperRefs(null);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onClickOutside, true);
      document.removeEventListener('touchstart', onClickOutside, true);
    }
  }, [onClickOutside, onKeyDown, popperRefs]);

  const initialize = React.useCallback(() => {
    if (!nodeRef.current || !reference || !isOpen) {
      return;
    }

    destroy();

    popperRefs(
      new PopperJS(
        getReference(typeof reference === 'function' ? reference() : reference),
        nodeRef.current,
        {
          placement,
          ...popperOptions,
          modifiers: {
            preventOverflow: {
              boundariesElement: 'window',
            },
            ...popperOptions.modifiers,
          },
        },
      ),
    );

    // init document listenerrs
    if (closeOnEsc) {
      document.addEventListener('keydown', onKeyDown, true);
    }
    if (closeOnOutsideClick) {
      document.addEventListener('mousedown', onClickOutside, true);
      document.addEventListener('touchstart', onClickOutside, true);
    }
  }, [
    popperRefs,
    reference,
    isOpen,
    destroy,
    placement,
    popperOptions,
    closeOnEsc,
    closeOnOutsideClick,
    onKeyDown,
    onClickOutside,
  ]);

  const nodeRefCallback = React.useCallback(
    (node) => {
      nodeRef.current = node;
      initialize();
    },
    [initialize],
  );

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  React.useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  React.useEffect(() => {
    if (!isOpen) {
      destroy();
    }
  }, [destroy, isOpen]);

  return isOpen ? (
    <Portal container={container}>
      <div ref={nodeRefCallback} className={className} style={{ zIndex }}>
        {children}
      </div>
    </Portal>
  ) : null;
};

export default Popper;
