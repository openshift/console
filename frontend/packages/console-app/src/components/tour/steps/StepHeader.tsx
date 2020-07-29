import * as React from 'react';

type StepHeaderProps = {
  children: string;
};

const StepHeader: React.FC<StepHeaderProps> = ({ children }) => <b>{children}</b>;

export default StepHeader;
