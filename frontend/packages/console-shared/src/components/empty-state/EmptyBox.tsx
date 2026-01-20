import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleEmptyState } from './ConsoleEmptyState';

export const EmptyBox: FC<EmptyBoxProps> = ({ label }) => {
  const { t } = useTranslation('console-shared');
  return (
    <ConsoleEmptyState data-test="empty-box">
      {label ? t('No {{label}} found', { label }) : t('Not found')}
    </ConsoleEmptyState>
  );
};
EmptyBox.displayName = 'EmptyBox';

type EmptyBoxProps = {
  label?: string;
};
