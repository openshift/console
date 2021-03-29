import * as React from 'react';
import { CSSTransition } from 'react-transition-group';

import './Sidebar.scss';

type LazyRender = () => React.ReactNode;
type SidebarProps = {
  children: React.ReactNode | LazyRender;
  closeAreaNode?: Node;
  onRequestClose?: () => void;
  open: boolean;
};

const DURATION = 225;

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { children, closeAreaNode = null, onRequestClose, open } = props;

  const [canClose, setCanClose] = React.useState(false);
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

  const closeRef = React.useCallback(() => {
    if (canClose && !!closeAreaNode && onRequestClose) {
      onRequestClose();
    }
  }, [canClose, closeAreaNode, onRequestClose]);
  React.useEffect(() => {
    if (typeof closeAreaNode?.addEventListener === 'function') {
      closeAreaNode.addEventListener('click', closeRef);
    }

    return () => {
      if (typeof closeAreaNode?.removeEventListener === 'function') {
        closeAreaNode.removeEventListener('click', closeRef);
      }
    };
  }, [closeAreaNode, closeRef]);

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
      <div className="odc-sidebar">{render()}</div>
    </CSSTransition>
  );
};

export default Sidebar;
