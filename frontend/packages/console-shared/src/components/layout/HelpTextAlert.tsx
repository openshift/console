import * as React from 'react';

const HelpTextAlert: React.FC<HelpTextAlertProps> = ({ children, ...props }) => {
  return (
    <div className="pf-v6-u-mt-md" {...props}>
      {children}
    </div>
  );
};

export type HelpTextAlertProps = {
  children: React.ReactNode;
};
export default HelpTextAlert;
