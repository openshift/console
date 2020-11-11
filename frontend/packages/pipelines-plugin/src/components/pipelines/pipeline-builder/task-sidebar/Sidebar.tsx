import * as React from 'react';
import { CSSTransition } from 'react-transition-group';

import './Sidebar.scss';

type LazyRender = () => React.ReactNode;
type SidebarProps = {
  children: React.ReactNode | LazyRender;
  onRequestClose: () => void;
  open: boolean;
};

const DURATION = 225;

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { children, onRequestClose, open } = props;

  const [canClose, setCanClose] = React.useState(false);
  const contentRef = React.useRef(null);
  const closeRef = React.useCallback(
    (e) => {
      if (canClose && !contentRef?.current?.contains(e?.target)) {
        onRequestClose();
      }
    },
    [canClose, onRequestClose],
  );

  React.useEffect(() => {
    let timeout = null;
    if (open) {
      timeout = setTimeout(() => setCanClose(true), DURATION);
    } else {
      setCanClose(false);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [open, setCanClose]);
  React.useEffect(() => {
    window.addEventListener('click', closeRef);

    return () => {
      window.removeEventListener('click', closeRef);
    };
  }, [closeRef]);

  const render = () => {
    if (typeof children === 'function') {
      if (open) {
        return (children as LazyRender)();
      }
    } else {
      return children;
    }
    return null;
  };

  return (
    <CSSTransition in={open} timeout={DURATION} classNames="odc-sidebar">
      <div ref={contentRef} className="odc-sidebar odc-sidebar__content">
        {render()}
      </div>
    </CSSTransition>
  );
};

export default Sidebar;
