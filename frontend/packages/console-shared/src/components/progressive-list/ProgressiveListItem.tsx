import * as React from 'react';

import './ProgressiveListItem.scss';

export interface ProgressiveListItemProps {
  children?: React.ReactNode;
  name: string;
}

const ProgressiveListItem: React.FCC<ProgressiveListItemProps> = ({ children }) => {
  const element = React.useRef<HTMLDivElement>();
  React.useEffect(() => {
    element.current.scrollIntoView({ behavior: 'smooth' });
  }, []);
  return (
    <div ref={element} className="ocs-progressive-list-section">
      {children}
    </div>
  );
};

export default ProgressiveListItem;
