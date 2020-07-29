import * as React from 'react';
import './StepBadge.scss';

type StepBadgeProps = {
  stepNumber: number;
  totalSteps: number;
};

const StepBadge: React.FC<StepBadgeProps> = ({ stepNumber, totalSteps }) => (
  <span className="co-step-badge">
    Step {stepNumber}/{totalSteps}
  </span>
);

export default StepBadge;
