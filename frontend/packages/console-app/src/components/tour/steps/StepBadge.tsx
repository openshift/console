import * as React from 'react';

type StepBadgeProps = {
  stepNumber: number;
  totalSteps: number;
};

const StepBadge: React.FC<StepBadgeProps> = ({ stepNumber, totalSteps }) => (
  <span>
    Step {stepNumber}/{totalSteps}
  </span>
);

export default StepBadge;
