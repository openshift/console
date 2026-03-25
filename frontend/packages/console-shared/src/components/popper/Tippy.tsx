import type { ReactNode, FC } from 'react';
import { useRef, useState, useCallback, useEffect } from 'react';
import type { PopperOptions } from 'popper.js';
import PopperJS from 'popper.js';
import { useEventListener } from '../../hooks/useEventListener';
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
  children?: ReactNode;
};

export const Tippy: FC<TippyProps> = ({
  placement = 'top',
  reference,
  children,
  className,
  zIndex = 9999,
  tippyOptions,
  onShow,
  onHide,
}) => {
  const popperInstance = useRef<PopperJS>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const targetElement = typeof reference === 'function' ? reference() : reference;
  const [isOpen, setOpen] = useState(false);

  const popperRef = useCallback((instance: PopperJS) => {
    popperInstance.current = instance;
  }, []);

  const initialize = useCallback(() => {
    nodeRef.current &&
      popperRef(new PopperJS(targetElement, nodeRef.current, { placement, ...tippyOptions }));
  }, [placement, popperRef, targetElement, tippyOptions]);

  const destroy = useCallback(() => {
    popperInstance.current?.destroy();
    popperRef(null);
  }, [popperRef]);

  const nodeRefCallback = useCallback(
    (node) => {
      nodeRef.current = node;
      initialize();
    },
    [initialize],
  );

  const show = useCallback(
    (e) => {
      if (!isOpen) {
        setOpen(true);
        onShow?.(e);
      }
    },
    [setOpen, onShow, isOpen],
  );
  const hide = useCallback(
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

  useEffect(() => {
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
