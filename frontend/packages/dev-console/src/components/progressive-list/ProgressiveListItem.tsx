import * as React from 'react';

export interface ProgressiveListItemProps {
  disableScroll?: boolean;
  name: string;
}

const ProgressiveListItem: React.FC<ProgressiveListItemProps> = ({ children, disableScroll }) => {
  const element = React.useRef<HTMLDivElement>();
  React.useEffect(() => {
    if (!disableScroll) {
      element.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [disableScroll]);
  return <div ref={element}>{children}</div>;
};

export default ProgressiveListItem;
