import type { ReactNode } from 'react';
import { useRef, useEffect } from 'react';

import './ProgressiveListItem.scss';

export interface ProgressiveListItemProps {
  children?: ReactNode;
  name: string;
}

const ProgressiveListItem: Snail.FCC<ProgressiveListItemProps> = ({ children }) => {
  const element = useRef<HTMLDivElement>();
  useEffect(() => {
    element.current.scrollIntoView({ behavior: 'smooth' });
  }, []);
  return (
    <div ref={element} className="ocs-progressive-list-section">
      {children}
    </div>
  );
};

export default ProgressiveListItem;
