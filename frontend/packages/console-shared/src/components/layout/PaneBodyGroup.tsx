import * as React from 'react';

const PaneBodyGroup: React.FC<PaneBodyGroupProps> = ({ children, ...props }) => {
  return (
    <div className="co-m-pane__body-group" {...props}>
      {children}
    </div>
  );
};

export type PaneBodyGroupProps = {
  children: React.ReactNode;
};
export default PaneBodyGroup;
