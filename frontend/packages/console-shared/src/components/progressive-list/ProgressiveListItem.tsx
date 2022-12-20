import * as React from 'react';

import './ProgressiveListItem.scss';

export interface ProgressiveListItemProps {
  name: string;
}

const ProgressiveListItem: React.FC<ProgressiveListItemProps> = ({ children }) => {
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
