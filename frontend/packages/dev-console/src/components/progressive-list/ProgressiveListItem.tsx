import * as React from 'react';
import '../import/ImportStrategySection.scss';

export interface ProgressiveListItemProps {
  name: string;
}

const ProgressiveListItem: React.FC<ProgressiveListItemProps> = ({ children }) => {
  const element = React.useRef<HTMLDivElement>();
  React.useEffect(() => {
    element.current.scrollIntoView({ behavior: 'smooth' });
  }, []);
  return (
    <div ref={element} className="odc-progressive-list-section">
      {children}
    </div>
  );
};

export default ProgressiveListItem;
