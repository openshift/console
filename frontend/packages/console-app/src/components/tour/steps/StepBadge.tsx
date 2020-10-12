import * as React from 'react';
import { useTranslation } from 'react-i18next';
import './StepBadge.scss';

type StepBadgeProps = {
  stepNumber: number;
  totalSteps: number;
};

const StepBadge: React.FC<StepBadgeProps> = ({ stepNumber, totalSteps }) => {
  const { t } = useTranslation();
  return (
    <span className="co-step-badge">
      {t('tour~Step {{stepNumber, number}}/{{totalSteps, number}}', {
        stepNumber,
        totalSteps,
      })}
    </span>
  );
};

export default StepBadge;
