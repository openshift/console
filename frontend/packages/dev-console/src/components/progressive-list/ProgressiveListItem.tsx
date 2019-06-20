import * as React from 'react';

export interface ProgressiveListItemProps {
  name: string;
}

const ProgressiveListItem: React.FC<ProgressiveListItemProps> = ({ children }) => {
  const element = React.createRef<HTMLDivElement>();
  React.useEffect(() => {
    element.current.scrollIntoView({ behavior: 'smooth' });
    // this effect needs to run only on first render that why dependency array is kept empty
    // Error: React Hook React.useEffect has a missing dependency: 'element'. Either include it or remove the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={element}>{children}</div>;
};

export default ProgressiveListItem;
