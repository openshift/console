import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './StepBadge.scss';

type StepBadgeProps = {
  stepNumber: number;
  totalSteps: number;
};

const StepBadge: FC<StepBadgeProps> = ({ stepNumber, totalSteps }) => {
  const { t } = useTranslation('console-app');
  return (
    <span className="co-step-badge">
      {t('Step {{stepNumber, number}}/{{totalSteps, number}}', {
        stepNumber,
        totalSteps,
      })}
    </span>
  );
};

export default StepBadge;
