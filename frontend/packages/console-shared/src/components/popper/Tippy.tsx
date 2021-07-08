import * as React from 'react';
import PopperJS, { PopperOptions } from 'popper.js';
import { useEventListener } from '../../hooks';
import Portal from './Portal';

type TippyProps = {
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
  reference: Element | (() => Element);
  className?: string;
  zIndex?: number;
  tippyOptions?: PopperOptions;
  onShow?: (event: Event) => void;
  onHide?: (event: Event) => void;
};

export const Tippy: React.FC<TippyProps> = ({
  placement = 'top',
  reference,
  children,
  className,
  zIndex = 9999,
  tippyOptions,
  onShow,
  onHide,
}) => {
  const popperInstance = React.useRef<PopperJS>(null);
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const targetElement = typeof reference === 'function' ? reference() : reference;
  const [isOpen, setOpen] = React.useState(false);

  const popperRef = React.useCallback((instance: PopperJS) => {
    popperInstance.current = instance;
  }, []);

  const initialize = React.useCallback(() => {
    nodeRef.current &&
      popperRef(new PopperJS(targetElement, nodeRef.current, { placement, ...tippyOptions }));
  }, [placement, popperRef, targetElement, tippyOptions]);

  const destroy = React.useCallback(() => {
    popperInstance.current?.destroy();
    popperRef(null);
  }, [popperRef]);

  const nodeRefCallback = React.useCallback(
    (node) => {
      nodeRef.current = node;
      initialize();
    },
    [initialize],
  );

  const show = React.useCallback(
    (e) => {
      if (!isOpen) {
        setOpen(true);
        onShow?.(e);
      }
    },
    [setOpen, onShow, isOpen],
  );
  const hide = React.useCallback(
    (e) => {
      if (isOpen) {
        setOpen(false);
        destroy();
        onHide?.(e);
      }
    },
    [setOpen, onHide, isOpen, destroy],
  );

  useEventListener(targetElement, 'mouseenter', show);
  useEventListener(targetElement, 'mouseleave', hide);
  useEventListener(targetElement, 'focus', show);
  useEventListener(targetElement, 'blur', hide);

  React.useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return isOpen ? (
    <Portal>
      <div
        ref={nodeRefCallback}
        className={className}
        style={{ zIndex, position: 'absolute', top: 0, left: 0 }}
      >
        {children}
      </div>
    </Portal>
  ) : null;
};
