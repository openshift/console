import * as React from 'react';
import './StepHeader.scss';

type StepHeaderProps = {
  children: string;
};

const StepHeader: React.FC<StepHeaderProps> = ({ children }) => (
  <b className="co-step-header">{children}</b>
);

export default StepHeader;
