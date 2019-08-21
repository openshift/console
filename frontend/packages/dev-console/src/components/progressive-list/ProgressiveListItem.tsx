import * as React from 'react';

export interface ProgressiveListItemProps {
  name: string;
}

const ProgressiveListItem: React.FC<ProgressiveListItemProps> = ({ children }) => {
  const element = React.useRef<HTMLDivElement>();
  React.useEffect(() => {
    element.current.scrollIntoView({ behavior: 'smooth' });
  }, []);
  return <div ref={element}>{children}</div>;
};

export default ProgressiveListItem;
