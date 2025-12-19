import type { ReactNode } from 'react';

const PaneBodyGroup: React.FCC<PaneBodyGroupProps> = ({ children, ...props }) => {
  return (
    <div className="co-m-pane__body-group" {...props}>
      {children}
    </div>
  );
};

export type PaneBodyGroupProps = {
  children: ReactNode;
};
export default PaneBodyGroup;
