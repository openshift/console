import type { FC } from 'react';
import type { StepContentType } from '../type';
import './StepContent.scss';

type StepContentProps = {
  children: StepContentType;
};

const StepContent: FC<StepContentProps> = ({ children }) => (
  <div className="co-step-content">{children}</div>
);

export default StepContent;
